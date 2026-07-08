import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  CreditCard,
  Download,
  FileText,
  History,
  LoaderCircle,
  Plus,
  Receipt,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react';
import { useToast } from '../components/Toast';

import Modal from '../components/Modal';
import { usePayroll } from '../hooks/usePayroll';
import {
  PayrollItem,
  PayrollMandatoryInsuranceBreakdown,
  PayrollPeriod,
  PayrollPeriodDetail,
  PayrollStatus,
  Role,
} from '../types';

type PayrollTab = 'current' | 'history' | 'advances' | 'statistics';

type PayrollPeriodForm = {
  code: string;
  name: string;
  periodStart: string;
  periodEnd: string;
  standardWorkingDays: string;
};

type PayrollManualAdjustmentForm = {
  allowance: number;
  bonus: number;
  otherDeduction: number;
  otherDeductionReason: string;
  note: string;
};

type SortColumn = 'employeeName' | 'workedDayEquivalent' | 'baseSalarySnapshot' | 'adjustmentAmount' | 'grossSalary' | 'totalDeductions' | 'netSalary';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

function formatDateLabel(dateValue: string) {
  return new Date(dateValue).toLocaleDateString('vi-VN');
}

const EMPTY_MANDATORY_INSURANCE: PayrollMandatoryInsuranceBreakdown = {
  insuranceBase: 0,
  socialInsurance: 0,
  healthInsurance: 0,
  unemploymentInsurance: 0,
  total: 0,
};

function getStatusBadgeClasses(status: PayrollStatus) {
  switch (status) {
    case 'DRAFT':
      return 'bg-slate-100 text-slate-700';
    case 'CALCULATED':
      return 'bg-blue-100 text-blue-700';
    case 'HR_REVIEWED':
      return 'bg-amber-100 text-amber-700';
    case 'APPROVED':
      return 'bg-emerald-100 text-emerald-700';
    case 'PAID':
      return 'bg-violet-100 text-violet-700';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

function canEditManualAdjustments(status: PayrollStatus) {
  return (
    status === 'DRAFT' ||
    status === 'CALCULATED' ||
    status === 'HR_REVIEWED'
  );
}

function getManualAdjustments(item: PayrollItem) {
  return {
    allowance: item.manualAdjustments?.allowance ?? 0,
    bonus: item.manualAdjustments?.bonus ?? 0,
    otherDeduction: item.manualAdjustments?.otherDeduction ?? 0,
    otherDeductionReason: item.manualAdjustments?.otherDeductionReason ?? '',
    note: item.manualAdjustments?.note ?? '',
    updatedBy: item.manualAdjustments?.updatedBy ?? null,
    updatedAt: item.manualAdjustments?.updatedAt ?? null,
  };
}

function getSystemEarnings(item: PayrollItem) {
  return {
    baseSalaryProrated: item.systemEarnings?.baseSalaryProrated ?? item.grossSalary,
  };
}

function getSystemDeductions(item: PayrollItem) {
  return {
    mandatoryInsurance:
      item.systemDeductions?.mandatoryInsurance ?? EMPTY_MANDATORY_INSURANCE,
    personalIncomeTax: item.systemDeductions?.personalIncomeTax ?? 0,
  };
}

function getItemWarnings(item: PayrollItem) {
  return item.warnings ?? [];
}

function formatPayrollWarning(warning: string) {
  switch (warning) {
    case 'INSURANCE_BASE_BELOW_REGIONAL_MINIMUM':
      return 'Muc dong bao hiem dang thap hon muc toi thieu vung da cau hinh.';
    case 'NEGATIVE_NET_SALARY':
      return 'Thuc nhan dang am. Hay kiem tra lai allowance, bonus, khau tru khac va bao hiem bat buoc.';
    default:
      return warning;
  }
}

function sanitizePayrollAmount(value: number) {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function parsePayrollAmountInput(value: string) {
  if (!value.trim()) {
    return 0;
  }

  return sanitizePayrollAmount(Number(value));
}

function getPayrollAdjustmentAmountError(manualAdjustments: {
  allowance: number;
  bonus: number;
  otherDeduction: number;
}) {
  const amountEntries = [
    ['allowance', manualAdjustments.allowance],
    ['bonus', manualAdjustments.bonus],
    ['otherDeduction', manualAdjustments.otherDeduction],
  ] as const;

  for (const [fieldName, amount] of amountEntries) {
    if (!Number.isFinite(amount) || amount < 0) {
      return `Gia tri ${fieldName} khong hop le. Vui long nhap so khong am.`;
    }
  }

  return null;
}

function getAdjustmentAmount(item: PayrollItem) {
  const manualAdjustments = getManualAdjustments(item);
  return (
    manualAdjustments.allowance +
    manualAdjustments.bonus -
    manualAdjustments.otherDeduction
  );
}

function hasManualAdjustments(item: PayrollItem) {
  const manualAdjustments = getManualAdjustments(item);
  return (
    manualAdjustments.allowance > 0 ||
    manualAdjustments.bonus > 0 ||
    manualAdjustments.otherDeduction > 0 ||
    manualAdjustments.otherDeductionReason.trim().length > 0 ||
    manualAdjustments.note.trim().length > 0
  );
}

function formatSignedCurrency(amount: number) {
  if (amount > 0) {
    return `+${formatCurrency(amount)}`;
  }

  if (amount < 0) {
    return `-${formatCurrency(Math.abs(amount))}`;
  }

  return formatCurrency(0);
}

function calculatePayrollPreview(
  item: PayrollItem,
  manualAdjustments: {
    allowance: number;
    bonus: number;
    otherDeduction: number;
  },
) {
  const systemEarnings = getSystemEarnings(item);
  const systemDeductions = getSystemDeductions(item);
  const grossSalary =
    systemEarnings.baseSalaryProrated +
    manualAdjustments.allowance +
    manualAdjustments.bonus;
  const totalDeductions =
    systemDeductions.mandatoryInsurance.total +
    systemDeductions.personalIncomeTax +
    manualAdjustments.otherDeduction;

  return {
    grossSalary,
    totalDeductions,
    netSalary: grossSalary - totalDeductions,
  };
}

function getNextPayrollAction(status: PayrollStatus) {
  switch (status) {
    case 'DRAFT':
      return {
        label: 'Tính lương',
        description: 'Ghi nhận dữ liệu lương và tạo các khoản lương.',
        action: 'calculate' as const,
      };
    case 'CALCULATED':
      return {
        label: 'Đánh dấu HR đã duyệt',
        description: 'Chuyển kỳ lương sang trạng thái HR_REVIEWED.',
        action: 'review' as const,
      };
    case 'HR_REVIEWED':
      return {
        label: 'Duyệt lương',
        description: 'Duyệt kỳ lương này để thanh toán.',
        action: 'approve' as const,
      };
    case 'APPROVED':
      return {
        label: 'Đánh dấu đã thanh toán',
        description: 'Khóa kỳ lương, lương đã thanh toán không thể thay đổi.',
        action: 'paid' as const,
      };
    default:
      return null;
  }
}

function getPrevPayrollAction(status: PayrollStatus) {
  switch (status) {
    case 'CALCULATED':
      return {
        label: 'Hoàn về Nháp',
        description: 'Chuyển kỳ lương về trạng thái DRAFT để chỉnh sửa lại.',
        action: 'revert-to-draft' as const,
      };
    case 'HR_REVIEWED':
      return {
        label: 'Hoàn về Đã tính',
        description: 'Chuyển kỳ lương về trạng thái CALCULATED.',
        action: 'revert-to-calculated' as const,
      };
    case 'APPROVED':
      return {
        label: 'Hoàn về HR đã duyệt',
        description: 'Chuyển kỳ lương về trạng thái HR_REVIEWED.',
        action: 'revert-to-hr-reviewed' as const,
      };
    default:
      return null;
  }
}

function getDefaultPeriodForm(): PayrollPeriodForm {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const firstDay = `${year}-${month}-01`;
  const lastDay = new Date(year, now.getMonth() + 1, 0);
  const periodEnd = `${year}-${month}-${String(lastDay.getDate()).padStart(2, '0')}`;

  return {
    code: `${year}-${month}`,
    name: `Payroll ${month}/${year}`,
    periodStart: firstDay,
    periodEnd,
    standardWorkingDays: '22',
  };
}

function sortPeriodsDescending(periods: PayrollPeriod[]) {
  return [...periods].sort((left, right) =>
    right.periodStart.localeCompare(left.periodStart),
  );
}

function sortItemsDescending(items: PayrollItem[]) {
  return [...items].sort((left, right) =>
    right.periodCode.localeCompare(left.periodCode),
  );
}

function showDeferredFeatureAlert(featureName: string) {
  window.alert(
    `${featureName} is not supported in this sprint yet. I kept it visible as a deferred feature from the previous UI.`,
  );
}

function getPageNotice(userRole: Role) {
  if (userRole === 'HR Admin') {
    return {
      title: 'Thao tác quản lý lương hiện chỉ dành cho Super Admin',
      body: 'Task 6 shipped live payroll APIs, but backend admin scope has not been expanded to HR Admin yet.',
    };
  }

  return {
    title: 'Quyền truy cập lương chưa khả dụng cho vai trò này',
    body: 'This screen stays deferred until backend scope for the role is defined.',
  };
}

export default function Payroll({ userRole }: { userRole: Role }) {
  const { showToast } = useToast();
  const isSuperAdmin = userRole === 'Super Admin';
  const isHrAdmin = userRole === 'HR Admin';
  const isEmployee = userRole === 'Employee';
  const canUseLiveAdminPayroll = isSuperAdmin || isHrAdmin;
  const canUseLiveSelfPayroll = isEmployee;

  const [activeTab, setActiveTab] = useState<PayrollTab>(
    isEmployee ? 'history' : 'current',
  );
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<SortColumn>('employeeName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [pageActionError, setPageActionError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPayrollItem, setSelectedPayrollItem] = useState<PayrollItem | null>(
    null,
  );
  const [isPayrollDrawerEditing, setIsPayrollDrawerEditing] = useState(false);
  const [payrollAdjustmentForm, setPayrollAdjustmentForm] =
    useState<PayrollManualAdjustmentForm>({
      allowance: 0,
      bonus: 0,
      otherDeduction: 0,
      otherDeductionReason: '',
      note: '',
    });
  const [periodForm, setPeriodForm] = useState<PayrollPeriodForm>(
    getDefaultPeriodForm(),
  );

  const {
    periods,
    selectedPeriod,
    myPayrollItems,
    isPeriodsLoading,
    isPeriodLoading,
    isMyPayrollLoading,
    periodsError,
    periodError,
    myPayrollError,
    createPeriod,
    calculatePeriod,
    reviewPeriod,
    approvePeriod,
    markPeriodPaid,
    revertToDraft,
    revertToCalculated,
    revertToHrReviewed,
    updateItemManualAdjustments,
    isCreatingPeriod,
    isCalculatingPeriod,
    isReviewingPeriod,
    isApprovingPeriod,
    isMarkingPaid,
    isRevertingToDraft,
    isRevertingToCalculated,
    isRevertingToHrReviewed,
    isUpdatingManualAdjustments,
  } = usePayroll({
    selectedPeriodId,
    loadPeriods: canUseLiveAdminPayroll,
    loadMine: canUseLiveSelfPayroll,
  });

  useEffect(() => {
    if (!canUseLiveAdminPayroll) {
      return;
    }

    if (!periods.length) {
      setSelectedPeriodId(null);
      return;
    }

    const hasSelectedPeriod = periods.some(period => period.id === selectedPeriodId);
    if (!hasSelectedPeriod) {
      setSelectedPeriodId(sortPeriodsDescending(periods)[0]?.id ?? null);
    }
  }, [canUseLiveAdminPayroll, periods, selectedPeriodId]);

  const sortedPeriods = sortPeriodsDescending(periods);
  const sortedMyPayrollItems = sortItemsDescending(myPayrollItems);
  const paidOrApprovedPeriods = sortedPeriods.filter(
    period => period.status === 'APPROVED' || period.status === 'PAID',
  );
  const selectedPeriodSummary = selectedPeriod as PayrollPeriodDetail | null;
  const selectedPeriodItems = selectedPeriodSummary?.items ?? [];
  const filteredPeriodItems = selectedPeriodItems.filter(item => 
    item.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.employeeCode.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const sortedFilteredPeriodItems = [...filteredPeriodItems].sort((a, b) => {
    let valA: any;
    let valB: any;

    switch (sortColumn) {
      case 'employeeName':
        valA = a.employeeName;
        valB = b.employeeName;
        break;
      case 'workedDayEquivalent':
        valA = a.attendanceSummary.workedDayEquivalent;
        valB = b.attendanceSummary.workedDayEquivalent;
        break;
      case 'baseSalarySnapshot':
        valA = a.baseSalarySnapshot;
        valB = b.baseSalarySnapshot;
        break;
      case 'adjustmentAmount':
        valA = getAdjustmentAmount(a);
        valB = getAdjustmentAmount(b);
        break;
      case 'grossSalary':
        valA = a.grossSalary;
        valB = b.grossSalary;
        break;
      case 'totalDeductions':
        valA = a.totalDeductions;
        valB = b.totalDeductions;
        break;
      case 'netSalary':
        valA = a.netSalary;
        valB = b.netSalary;
        break;
      default:
        valA = 0;
        valB = 0;
    }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalNetSalary = selectedPeriodItems.reduce(
    (sum, item) => sum + item.netSalary,
    0,
  );
  const totalGrossSalary = selectedPeriodItems.reduce(
    (sum, item) => sum + item.grossSalary,
    0,
  );
  const manualAdjustedItemCount = selectedPeriodItems.filter(hasManualAdjustments).length;
  const nextPayrollAction = selectedPeriodSummary
    ? getNextPayrollAction(selectedPeriodSummary.status)
    : null;
  const prevPayrollAction = selectedPeriodSummary
    ? getPrevPayrollAction(selectedPeriodSummary.status)
    : null;
  const selectedItemPreview = selectedPayrollItem
    ? calculatePayrollPreview(selectedPayrollItem, {
        allowance: sanitizePayrollAmount(payrollAdjustmentForm.allowance),
        bonus: sanitizePayrollAmount(payrollAdjustmentForm.bonus),
        otherDeduction: sanitizePayrollAmount(payrollAdjustmentForm.otherDeduction),
      })
    : null;
  const selectedItemSystemDeductions = selectedPayrollItem
    ? getSystemDeductions(selectedPayrollItem)
    : null;
  const selectedItemMandatoryInsurance =
    selectedItemSystemDeductions?.mandatoryInsurance ?? EMPTY_MANDATORY_INSURANCE;
  const selectedItemWarnings = selectedPayrollItem
    ? getItemWarnings(selectedPayrollItem)
    : [];
  const showNegativeNetPreviewWarning =
    !!selectedItemPreview && selectedItemPreview.netSalary < 0;
  const canEditSelectedPayrollItem =
    !!selectedPayrollItem &&
    !!selectedPeriodSummary &&
    canUseLiveAdminPayroll &&
    selectedPeriodSummary.id === selectedPayrollItem.periodId &&
    canEditManualAdjustments(selectedPeriodSummary.status);
  const isOtherDeductionReasonMissing =
    isPayrollDrawerEditing &&
    payrollAdjustmentForm.otherDeduction > 0 &&
    !payrollAdjustmentForm.otherDeductionReason.trim();
  const payrollAdjustmentAmountError = getPayrollAdjustmentAmountError({
    allowance: payrollAdjustmentForm.allowance,
    bonus: payrollAdjustmentForm.bonus,
    otherDeduction: payrollAdjustmentForm.otherDeduction,
  });

  const pageError = periodsError || periodError || myPayrollError || pageActionError;
  const isBusy =
    isCreatingPeriod ||
    isCalculatingPeriod ||
    isReviewingPeriod ||
    isApprovingPeriod ||
    isMarkingPaid ||
    isRevertingToDraft ||
    isRevertingToCalculated ||
    isRevertingToHrReviewed ||
    isUpdatingManualAdjustments;

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return <ChevronsUpDown className="ml-1 inline h-3 w-3 opacity-40" />;
    if (sortDirection === 'asc') return <ChevronUp className="ml-1 inline h-3 w-3" />;
    return <ChevronDown className="ml-1 inline h-3 w-3" />;
  };

  const handleOpenCreateModal = () => {
    setPeriodForm(getDefaultPeriodForm());
    setPageActionError(null);
    setIsCreateModalOpen(true);
  };

  const handleCreatePeriod = async () => {
    try {
      setPageActionError(null);
      const createdPeriod = await createPeriod({
        code: periodForm.code.trim(),
        name: periodForm.name.trim(),
        periodStart: periodForm.periodStart,
        periodEnd: periodForm.periodEnd,
        standardWorkingDays: Number(periodForm.standardWorkingDays),
      });
      setSelectedPeriodId(createdPeriod.id);
      setIsCreateModalOpen(false);
      showToast({ type: 'success', message: `Đã tạo kỳ lương “${createdPeriod.name}”.` });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unable to create payroll period.';
      setPageActionError(msg);
      showToast({ type: 'error', message: msg });
    }
  };

  const handleRunPayrollAction = async () => {
    if (!selectedPeriodSummary || !nextPayrollAction) {
      return;
    }

    try {
      setPageActionError(null);

      switch (nextPayrollAction.action) {
        case 'calculate':
          await calculatePeriod(selectedPeriodSummary.id);
          break;
        case 'review':
          await reviewPeriod(selectedPeriodSummary.id);
          break;
        case 'approve':
          await approvePeriod(selectedPeriodSummary.id);
          break;
        case 'paid':
          await markPeriodPaid(selectedPeriodSummary.id);
          break;
      }
      showToast({ type: 'success', message: `Đã thực hiện: ${nextPayrollAction.label}.` });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unable to update payroll status.';
      setPageActionError(msg);
      showToast({ type: 'error', message: msg });
    }
  };

  const handleRevertPayrollAction = async () => {
    if (!selectedPeriodSummary || !prevPayrollAction) {
      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc muốn hoàn về trạng thái trước không? Thao tác này sẽ đưa kỳ lương về trạng thái "${prevPayrollAction.description.split('.')[0]}".`,
    );
    if (!confirmed) return;

    try {
      setPageActionError(null);

      switch (prevPayrollAction.action) {
        case 'revert-to-draft':
          await revertToDraft(selectedPeriodSummary.id);
          break;
        case 'revert-to-calculated':
          await revertToCalculated(selectedPeriodSummary.id);
          break;
        case 'revert-to-hr-reviewed':
          await revertToHrReviewed(selectedPeriodSummary.id);
          break;
      }
      showToast({ type: 'success', message: `Đã hoàn về: ${prevPayrollAction.label}.` });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unable to revert payroll status.';
      setPageActionError(msg);
      showToast({ type: 'error', message: msg });
    }
  };

  const handleOpenPayrollItem = (item: PayrollItem) => {
    const manualAdjustments = getManualAdjustments(item);
    setPageActionError(null);
    setSelectedPayrollItem(item);
    setIsPayrollDrawerEditing(false);
    setPayrollAdjustmentForm({
      allowance: manualAdjustments.allowance,
      bonus: manualAdjustments.bonus,
      otherDeduction: manualAdjustments.otherDeduction,
      otherDeductionReason: manualAdjustments.otherDeductionReason,
      note: manualAdjustments.note,
    });
  };

  const handleClosePayrollItem = () => {
    setPageActionError(null);
    setSelectedPayrollItem(null);
    setIsPayrollDrawerEditing(false);
  };

  const handleSavePayrollAdjustments = async () => {
    if (!selectedPayrollItem) {
      return;
    }

    if (
      payrollAdjustmentForm.otherDeduction > 0 &&
      !payrollAdjustmentForm.otherDeductionReason.trim()
    ) {
      setPageActionError('Vui long nhap ly do khau tru khac truoc khi luu.');
      return;
    }

    if (payrollAdjustmentAmountError) {
      setPageActionError(payrollAdjustmentAmountError);
      return;
    }

    try {
      setPageActionError(null);
      const updatedItem = await updateItemManualAdjustments({
        payrollItemId: selectedPayrollItem.id,
        allowance: sanitizePayrollAmount(payrollAdjustmentForm.allowance),
        bonus: sanitizePayrollAmount(payrollAdjustmentForm.bonus),
        otherDeduction: sanitizePayrollAmount(payrollAdjustmentForm.otherDeduction),
        otherDeductionReason:
          payrollAdjustmentForm.otherDeduction > 0
            ? payrollAdjustmentForm.otherDeductionReason.trim() || null
            : null,
        note: payrollAdjustmentForm.note.trim() || undefined,
      });
      const manualAdjustments = getManualAdjustments(updatedItem);
      setSelectedPayrollItem(updatedItem);
      setPayrollAdjustmentForm({
        allowance: manualAdjustments.allowance,
        bonus: manualAdjustments.bonus,
        otherDeduction: manualAdjustments.otherDeduction,
        otherDeductionReason: manualAdjustments.otherDeductionReason,
        note: manualAdjustments.note,
      });
      setIsPayrollDrawerEditing(false);
      showToast({ type: 'success', message: 'Đã lưu điều chỉnh lương thành công.' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unable to update payroll adjustments.';
      setPageActionError(msg);
      showToast({ type: 'error', message: msg });
    }
  };

  const renderDeferredPanel = (featureName: string, description: string) => (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div className="space-y-3">
          <div>
            <h3 className="text-base font-semibold text-amber-950">{featureName}</h3>
            <p className="mt-1 text-sm text-amber-800">{description}</p>
          </div>
          <button
            type="button"
            onClick={() => showDeferredFeatureAlert(featureName)}
            className="inline-flex items-center rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
          >
            Thảo luận trước khi bật
          </button>
        </div>
      </div>
    </div>
  );

  if (!canUseLiveAdminPayroll && !canUseLiveSelfPayroll) {
    const notice = getPageNotice(userRole);
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-lg font-semibold text-amber-950">{notice.title}</h2>
          <p className="mt-2 text-sm text-amber-800">{notice.body}</p>
        </div>
        {renderDeferredPanel(
          'Tính năng mẫu lương cũ',
          'The old screen still had salary advances, analytics, and export promises. They remain deferred until backend scope is expanded.',
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Lương
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Hệ thống lương theo thời gian thực hoạt động dựa trên backend và không thay đổi lương đã thanh toán.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveTab(isEmployee ? 'history' : 'current')}
                className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium ${
                  activeTab === 'current'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Receipt className="mr-2 h-4 w-4" />
                {isEmployee ? 'Lương mới nhất của tôi' : 'Kỳ hiện tại'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium ${
                  activeTab === 'history'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <History className="mr-2 h-4 w-4" />
                Lịch sử
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('advances')}
                className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium ${
                  activeTab === 'advances'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Tạm ứng
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('statistics')}
                className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium ${
                  activeTab === 'statistics'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Thống kê
              </button>
            </div>
          </div>

          {canUseLiveAdminPayroll ? (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => showDeferredFeatureAlert('Xuất Excel')}
                className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Download className="mr-2 h-4 w-4" />
                Xuất Excel
              </button>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                <Plus className="mr-2 h-4 w-4" />
                Tạo kỳ
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {pageError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {pageError}
        </div>
      ) : null}

      {canUseLiveAdminPayroll && activeTab === 'current' ? (
        <div className="grid gap-6 grid-cols-1">
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-slate-900">Chọn kỳ lương</h2>
              <div className="text-xs text-slate-500">
                {sortedPeriods.length} kỳ trong hệ thống
              </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
              {isPeriodsLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-500 px-1">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Đang tải các kỳ lương...
                </div>
              ) : sortedPeriods.length > 0 ? (
                sortedPeriods.map(period => (
                  <button
                    key={period.id}
                    type="button"
                    onClick={() => setSelectedPeriodId(period.id)}
                    className={`flex-shrink-0 w-72 snap-start rounded-2xl border p-4 text-left transition-all ${
                      selectedPeriodId === period.id
                        ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-bold">{period.name}</p>
                        <p
                          className={`mt-0.5 text-xs ${
                            selectedPeriodId === period.id
                              ? 'text-slate-300'
                              : 'text-slate-500'
                          }`}
                        >
                          {period.code}
                        </p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                          selectedPeriodId === period.id
                            ? 'bg-white/20 text-white'
                            : getStatusBadgeClasses(period.status)
                        }`}
                      >
                        {period.status}
                      </span>
                    </div>
                    <div className={`text-xs ${
                      selectedPeriodId === period.id
                        ? 'text-slate-400'
                        : 'text-slate-500'
                    }`}>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDateLabel(period.periodStart)} - {formatDateLabel(period.periodEnd)}</span>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-sm text-slate-500 px-1">
                  Chưa có kỳ lương nào. Hãy tạo một kỳ để bắt đầu.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {selectedPeriodSummary?.name ?? 'Chọn một kỳ lương'}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {selectedPeriodSummary
                      ? `${selectedPeriodSummary.code} • ${formatDateLabel(
                          selectedPeriodSummary.periodStart,
                        )} - ${formatDateLabel(selectedPeriodSummary.periodEnd)} • ${
                          selectedPeriodSummary.standardWorkingDays
                        } ngày tiêu chuẩn`
                      : 'Chọn một kỳ lương từ danh sách bên trái để xem workspace chi tiết.'}
                  </p>
                </div>

                {selectedPeriodSummary ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => showDeferredFeatureAlert('Xuất PDF')}
                      className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Xuất PDF
                    </button>
                    {prevPayrollAction ? (
                      <button
                        type="button"
                        onClick={() => void handleRevertPayrollAction()}
                        disabled={isBusy}
                        title={prevPayrollAction.description}
                        className="inline-flex items-center rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isBusy ? (
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowLeft className="mr-2 h-4 w-4" />
                        )}
                        {prevPayrollAction.label}
                      </button>
                    ) : null}
                    {nextPayrollAction ? (
                      <button
                        type="button"
                        onClick={() => void handleRunPayrollAction()}
                        disabled={isBusy}
                        className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isBusy ? (
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowRight className="mr-2 h-4 w-4" />
                        )}
                        {nextPayrollAction.label}
                      </button>
                    ) : (
                      <span className="inline-flex rounded-lg bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                        {selectedPeriodSummary.status === 'PAID'
                          ? 'Lương đã thanh toán bị khóa'
                          : 'Không có thao tác nào khác'}
                      </span>
                    )}
                  </div>
                ) : null}

              </div>

              {selectedPeriodSummary ? (
                <>
                  <div className="grid gap-4 border-b border-slate-100 px-5 py-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Nhân viên
                      </p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">
                        {selectedPeriodItems.length}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Tổng lương (Gross)
                      </p>
                      <p className="mt-2 text-lg font-bold text-slate-900">
                        {formatCurrency(totalGrossSalary)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Thực nhận (Net)
                      </p>
                      <p className="mt-2 text-lg font-bold text-slate-900">
                        {formatCurrency(totalNetSalary)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Trạng thái kỳ lương
                      </p>
                      <div className="mt-3">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClasses(
                            selectedPeriodSummary.status,
                          )}`}
                        >
                          {selectedPeriodSummary.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {nextPayrollAction ? (
                    <div className="border-b border-slate-100 px-5 py-4 text-sm text-slate-600">
                      {nextPayrollAction.description}
                    </div>
                  ) : null}

                  {manualAdjustedItemCount > 0 ? (
                    <div className="border-b border-amber-100 bg-amber-50 px-5 py-3 text-sm text-amber-900">
                      {manualAdjustedItemCount} phiếu lương có điều chỉnh thủ công.
                    </div>
                  ) : null}

                  <div className="border-b border-slate-100 px-5 py-4">
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Tìm kiếm nhân viên theo tên hoặc mã..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="block w-full max-w-sm rounded-lg border border-slate-300 bg-slate-50 p-2.5 pl-10 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </>
              ) : null}

              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="cursor-pointer select-none px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:bg-slate-100" onClick={() => handleSort('employeeName')}>
                        Nhân viên {renderSortIcon('employeeName')}
                      </th>
                      <th className="cursor-pointer select-none px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:bg-slate-100" onClick={() => handleSort('workedDayEquivalent')}>
                        Ngày làm việc {renderSortIcon('workedDayEquivalent')}
                      </th>
                      <th className="cursor-pointer select-none px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 hover:bg-slate-100" onClick={() => handleSort('baseSalarySnapshot')}>
                        Lương cơ bản {renderSortIcon('baseSalarySnapshot')}
                      </th>
                      <th className="cursor-pointer select-none px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 hover:bg-slate-100" onClick={() => handleSort('adjustmentAmount')}>
                        Điều chỉnh {renderSortIcon('adjustmentAmount')}
                      </th>
                      <th className="cursor-pointer select-none px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 hover:bg-slate-100" onClick={() => handleSort('grossSalary')}>
                        Tổng (Gross) {renderSortIcon('grossSalary')}
                      </th>
                      <th className="cursor-pointer select-none px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 hover:bg-slate-100" onClick={() => handleSort('totalDeductions')}>
                        Khấu trừ {renderSortIcon('totalDeductions')}
                      </th>
                      <th className="cursor-pointer select-none px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 hover:bg-slate-100" onClick={() => handleSort('netSalary')}>
                        Thực nhận (Net) {renderSortIcon('netSalary')}
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Chi tiết
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isPeriodLoading ? (
                      <tr>
                        <td colSpan={8} className="px-5 py-6 text-sm text-slate-500">
                          Đang tải chi tiết lương...
                        </td>
                      </tr>
                    ) : sortedFilteredPeriodItems.length > 0 ? (
                      sortedFilteredPeriodItems.map(item => {
                        const adjustmentAmount = getAdjustmentAmount(item);

                        return (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="px-5 py-4">
                              <div className="space-y-1">
                                <p className="text-sm font-semibold text-slate-900">
                                  {item.employeeName}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                  <span>{item.employeeCode}</span>
                                  {hasManualAdjustments(item) ? (
                                    <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
                                      Đã điều chỉnh
                                    </span>
                                  ) : null}
                                  {getItemWarnings(item).length > 0 ? (
                                    <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
                                      {getItemWarnings(item).length} cảnh báo
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-sm text-slate-600">
                              {item.attendanceSummary.workedDayEquivalent.toFixed(2)} /{' '}
                              {item.standardWorkingDays}
                            </td>
                            <td className="px-5 py-4 text-right text-sm font-medium text-slate-700">
                              {formatCurrency(item.baseSalarySnapshot)}
                            </td>
                            <td
                              className={`px-5 py-4 text-right text-sm font-medium ${
                                adjustmentAmount > 0
                                  ? 'text-emerald-600'
                                  : adjustmentAmount < 0
                                    ? 'text-rose-600'
                                    : 'text-slate-500'
                              }`}
                            >
                              {formatSignedCurrency(adjustmentAmount)}
                            </td>
                            <td className="px-5 py-4 text-right text-sm font-medium text-slate-900">
                              {formatCurrency(item.grossSalary)}
                            </td>
                            <td className="px-5 py-4 text-right text-sm font-medium text-rose-600">
                              -{formatCurrency(item.totalDeductions)}
                            </td>
                            <td className="px-5 py-4 text-right text-sm font-bold text-slate-900">
                              {formatCurrency(item.netSalary)}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleOpenPayrollItem(item)}
                                className="text-sm font-medium text-blue-600 hover:text-blue-800"
                              >
                                Xem
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-5 py-6 text-sm text-slate-500">
                          {selectedPeriodItems.length > 0 ? 'Không tìm thấy nhân viên phù hợp với từ khóa.' : 'Chưa có chi tiết lương cho kỳ này.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700" />
                <div>
                  <h3 className="text-sm font-semibold text-amber-950">
                    Tạm hoãn từ phiên bản nguyên mẫu cũ
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm text-amber-900">
                    <li>Salary advances</li>
                    <li>Anomaly analytics and charts</li>
                    <li>Excel/PDF export promises</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {false && canUseLiveAdminPayroll && activeTab === 'current' ? (
        <div className="grid gap-6 grid-cols-1">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Tổng số kỳ
                </p>
                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {sortedPeriods.length}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Trạng thái đã chọn
                </p>
                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {selectedPeriodSummary?.status ?? '--'}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Thực nhận
                </p>
                <p className="mt-3 text-lg font-bold text-slate-900">
                  {formatCurrency(totalNetSalary)}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Kỳ lương
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Chọn một kỳ để xem chi tiết và tiếp tục quy trình.
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {isPeriodsLoading ? (
                  <div className="flex items-center gap-2 px-5 py-6 text-sm text-slate-500">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Đang tải các kỳ lương...
                  </div>
                ) : sortedPeriods.length > 0 ? (
                  sortedPeriods.map(period => (
                    <button
                      key={period.id}
                      type="button"
                      onClick={() => setSelectedPeriodId(period.id)}
                      className={`flex w-full items-start justify-between px-5 py-4 text-left transition-colors ${
                        selectedPeriodId === period.id
                          ? 'bg-slate-900 text-white'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold">{period.name}</p>
                        <p
                          className={`mt-1 text-xs ${
                            selectedPeriodId === period.id
                              ? 'text-slate-300'
                              : 'text-slate-500'
                          }`}
                        >
                          {period.code} • {formatDateLabel(period.periodStart)} -{' '}
                          {formatDateLabel(period.periodEnd)}
                        </p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          selectedPeriodId === period.id
                            ? 'bg-white/10 text-white'
                            : getStatusBadgeClasses(period.status)
                        }`}
                      >
                        {period.status}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-5 py-6 text-sm text-slate-500">
                    Chưa có kỳ lương nào. Hãy tạo một kỳ để bắt đầu.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    {selectedPeriodSummary?.name ?? 'Chọn một kỳ lương'}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedPeriodSummary
                      ? `${selectedPeriodSummary.code} • ${selectedPeriodSummary.standardWorkingDays} ngày tiêu chuẩn`
                      : 'Chọn một kỳ lương từ bên trái.'}
                  </p>
                </div>

                {selectedPeriodSummary ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => showDeferredFeatureAlert('Xuất PDF')}
                      className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Xuất PDF
                    </button>
                    {nextPayrollAction ? (
                      <button
                        type="button"
                        onClick={() => void handleRunPayrollAction()}
                        disabled={isBusy}
                        className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isBusy ? (
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowRight className="mr-2 h-4 w-4" />
                        )}
                        {nextPayrollAction.label}
                      </button>
                    ) : (
                      <span className="inline-flex rounded-lg bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                        {selectedPeriodSummary.status === 'PAID'
                          ? 'Lương đã thanh toán bị khóa'
                          : 'Không có thao tác nào khác'}
                      </span>
                    )}
                  </div>
                ) : null}
              </div>

              {selectedPeriodSummary ? (
                <div className="grid gap-4 border-b border-slate-100 px-5 py-4 md:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Nhân viên
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {selectedPeriodItems.length}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Tổng lương Gross
                    </p>
                    <p className="mt-2 text-lg font-bold text-slate-900">
                      {formatCurrency(totalGrossSalary)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Tổng lương Net
                    </p>
                    <p className="mt-2 text-lg font-bold text-slate-900">
                      {formatCurrency(totalNetSalary)}
                    </p>
                  </div>
                </div>
              ) : null}

              {selectedPeriodSummary && nextPayrollAction ? (
                <div className="border-b border-slate-100 px-5 py-4 text-sm text-slate-600">
                  {nextPayrollAction.description}
                </div>
              ) : null}

              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Nhân viên
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Ngày làm việc
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">
                        Lương cơ bản
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">
                        Lương Gross
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">
                        Lương Net
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">
                        Chi tiết
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isPeriodLoading ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-6 text-sm text-slate-500"
                        >
                          Đang tải chi tiết lương...
                        </td>
                      </tr>
                    ) : selectedPeriodItems.length > 0 ? (
                      selectedPeriodItems.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-slate-900">
                              {item.employeeName}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {item.employeeCode}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600">
                            {item.attendanceSummary.workedDayEquivalent.toFixed(2)} /{' '}
                            {item.standardWorkingDays}
                          </td>
                          <td className="px-5 py-4 text-right text-sm font-medium text-slate-700">
                            {formatCurrency(item.baseSalarySnapshot)}
                          </td>
                          <td className="px-5 py-4 text-right text-sm font-medium text-slate-900">
                            {formatCurrency(item.grossSalary)}
                          </td>
                          <td className="px-5 py-4 text-right text-sm font-bold text-slate-900">
                            {formatCurrency(item.netSalary)}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenPayrollItem(item)}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800"
                            >
                              Xem
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-6 text-sm text-slate-500"
                        >
                          Chưa có chi tiết lương cho kỳ này.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700" />
                <div>
                  <h3 className="text-sm font-semibold text-amber-950">
                    Tạm hoãn từ phiên bản nguyên mẫu cũ
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm text-amber-900">
                    <li>Salary advances</li>
                    <li>Anomaly analytics and charts</li>
                    <li>Excel/PDF export promises</li>
                    <li>Inline payroll editing after calculation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {canUseLiveAdminPayroll && activeTab === 'history' ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Kỳ lương đã xử lý
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Các kỳ đã duyệt và đã thanh toán hiển thị tại đây. Lương đã thanh toán không thể thay đổi.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Kỳ
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Khoảng thời gian
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Trạng thái
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">
                    Xem xét
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paidOrApprovedPeriods.length > 0 ? (
                  paidOrApprovedPeriods.map(period => (
                    <tr key={period.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                        {period.name}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDateLabel(period.periodStart)} -{' '}
                        {formatDateLabel(period.periodEnd)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusBadgeClasses(
                            period.status,
                          )}`}
                        >
                          {period.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPeriodId(period.id);
                            setActiveTab('current');
                          }}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          Mở kỳ lương
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-5 py-6 text-sm text-slate-500">
                      Chưa có kỳ lương nào được duyệt hoặc đã thanh toán.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {canUseLiveSelfPayroll && activeTab === 'current' ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Bản ghi lương mới nhất
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Bảng lương cá nhân chỉ xem trong phạm vi hiện tại.
                </p>
              </div>
              <button
                type="button"
                onClick={() => showDeferredFeatureAlert('Xuất PDF')}
                className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <FileText className="mr-2 h-4 w-4" />
                Xuất PDF
              </button>
            </div>

            {sortedMyPayrollItems[0] ? (
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Kỳ
                  </p>
                  <p className="mt-3 text-2xl font-bold text-slate-900">
                    {sortedMyPayrollItems[0].periodCode}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Lương Gross
                  </p>
                  <p className="mt-3 text-lg font-bold text-slate-900">
                    {formatCurrency(sortedMyPayrollItems[0].grossSalary)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Lương Net
                  </p>
                  <p className="mt-3 text-lg font-bold text-slate-900">
                    {formatCurrency(sortedMyPayrollItems[0].netSalary)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-500">
                Tài khoản này chưa có chi tiết lương nào.
              </div>
            )}

            {sortedMyPayrollItems[0] ? (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => handleOpenPayrollItem(sortedMyPayrollItems[0])}
                  className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Xem chi tiết lương mới nhất
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {canUseLiveSelfPayroll && activeTab === 'history' ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Các khoản lương
              </p>
              <p className="mt-3 text-3xl font-bold text-slate-900">
                {sortedMyPayrollItems.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Kỳ mới nhất
              </p>
              <p className="mt-3 text-3xl font-bold text-slate-900">
                {sortedMyPayrollItems[0]?.periodCode ?? '--'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Lương Net mới nhất
              </p>
              <p className="mt-3 text-lg font-bold text-slate-900">
                {sortedMyPayrollItems[0]
                  ? formatCurrency(sortedMyPayrollItems[0].netSalary)
                  : '--'}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">
                Lịch sử lương của tôi
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Bảng lương cá nhân chỉ có thể xem.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Kỳ
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Ngày làm việc
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">
                      Lương Gross
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">
                      Lương Net
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">
                      Chi tiết
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isMyPayrollLoading ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-6 text-sm text-slate-500">
                        Đang tải lương cá nhân...
                      </td>
                    </tr>
                  ) : sortedMyPayrollItems.length > 0 ? (
                    sortedMyPayrollItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                          {item.periodCode}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {item.attendanceSummary.workedDayEquivalent.toFixed(2)} /{' '}
                          {item.standardWorkingDays}
                        </td>
                        <td className="px-5 py-4 text-right text-sm font-medium text-slate-700">
                          {formatCurrency(item.grossSalary)}
                        </td>
                        <td className="px-5 py-4 text-right text-sm font-bold text-slate-900">
                          {formatCurrency(item.netSalary)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenPayrollItem(item)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-5 py-6 text-sm text-slate-500">
                        No personal payroll data yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700" />
              <div>
                <h3 className="text-sm font-semibold text-amber-950">
                  Deferred from the previous payroll prototype
                </h3>
                <ul className="mt-2 space-y-1 text-sm text-amber-900">
                  <li>Salary advance requests</li>
                  <li>Analytics and anomaly dashboards</li>
                  <li>Exported PDF payslips from the web UI</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === 'advances'
        ? renderDeferredPanel(
            'Tạm ứng lương',
            'The old payroll screen exposed salary advances, but this sprint does not ship the backend workflow for it.',
          )
        : null}

      {activeTab === 'statistics'
        ? renderDeferredPanel(
            'Thống kê lương',
            'Charts, anomaly detection, and payroll trend analytics remain outside the sprint scope.',
          )
        : null}

      {selectedPayrollItem ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm"
            onClick={handleClosePayrollItem}
          />
          <div className="fixed inset-y-0 right-0 z-50 flex w-full justify-end">
            <div className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Chi tiết phiếu lương
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">
                    {selectedPayrollItem.employeeName}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedPayrollItem.employeeCode} • Kỳ {selectedPayrollItem.periodCode}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClasses(
                      selectedPeriodSummary?.status ?? 'DRAFT',
                    )}`}
                  >
                    {selectedPeriodSummary?.status ?? 'READ_ONLY'}
                  </span>
                  <button
                    type="button"
                    onClick={handleClosePayrollItem}
                    className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-50/80 px-6 py-6">
                <div className="space-y-6">
                  {pageActionError ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                      {pageActionError}
                    </div>
                  ) : null}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Thông tin hỗ trợ
                        </p>
                        <p className="mt-2 text-sm text-slate-600">
                          Hệ thống giữ riêng số hệ thống tính và điều chỉnh thủ công của HR.
                        </p>
                      </div>
                      {hasManualAdjustments(selectedPayrollItem) ? (
                        <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          Đã điều chỉnh
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {selectedItemWarnings.length > 0 ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                        Cảnh báo hệ thống
                      </p>
                      <div className="mt-3 space-y-2 text-sm text-amber-900">
                        {selectedItemWarnings.map(warning => (
                          <div
                            key={warning}
                            className="rounded-xl border border-amber-200 bg-white/70 px-3 py-2"
                          >
                            {formatPayrollWarning(warning)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {showNegativeNetPreviewWarning ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      Cảnh báo preview: thực nhận đang âm. Hãy kiểm tra lại allowance,
                      bonus, khấu trừ khác và bảo hiểm bắt buộc trước khi lưu.
                    </div>
                  ) : null}

                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Thu nhập (Earnings)
                    </p>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="space-y-4 text-sm text-slate-700">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p>Lương cơ bản</p>
                            <p className="mt-1 text-xs text-slate-500">
                              Snapshot lương cơ bản của nhân viên.
                            </p>
                          </div>
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(selectedPayrollItem.baseSalarySnapshot)}
                          </span>
                        </div>
                        <div className="flex items-start justify-between gap-4 border-l-2 border-slate-200 pl-4">
                          <div>
                            <p>Lương theo công</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {selectedPayrollItem.attendanceSummary.workedDayEquivalent.toFixed(
                                2,
                              )}{' '}
                              / {selectedPayrollItem.standardWorkingDays} ngày. Được hệ
                              thống tính từ attendance và payroll settings.
                            </p>
                          </div>
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(
                              getSystemEarnings(selectedPayrollItem).baseSalaryProrated,
                            )}
                          </span>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p>Phụ cấp</p>
                            <p className="mt-1 text-xs text-slate-500">
                              Khoản điều chỉnh thủ công của HR.
                            </p>
                          </div>
                          {isPayrollDrawerEditing ? (
                            <input
                              type="number"
                              min={0}
                              value={payrollAdjustmentForm.allowance}
                              onChange={event =>
                                setPayrollAdjustmentForm(current => ({
                                  ...current,
                                  allowance: parsePayrollAmountInput(
                                    event.target.value,
                                  ),
                                }))
                              }
                              className="w-36 rounded-lg border border-slate-200 px-3 py-2 text-right text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                            />
                          ) : (
                            <span className="font-semibold text-slate-900">
                              {formatCurrency(getManualAdjustments(selectedPayrollItem).allowance)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p>Thưởng</p>
                            <p className="mt-1 text-xs text-slate-500">
                              Khoản thưởng thêm ngoài dữ liệu hệ thống.
                            </p>
                          </div>
                          {isPayrollDrawerEditing ? (
                            <input
                              type="number"
                              min={0}
                              value={payrollAdjustmentForm.bonus}
                              onChange={event =>
                                setPayrollAdjustmentForm(current => ({
                                  ...current,
                                  bonus: parsePayrollAmountInput(
                                    event.target.value,
                                  ),
                                }))
                              }
                              className="w-36 rounded-lg border border-slate-200 px-3 py-2 text-right text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                            />
                          ) : (
                            <span className="font-semibold text-emerald-600">
                              {formatSignedCurrency(getManualAdjustments(selectedPayrollItem).bonus)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
                          <span className="font-semibold text-slate-900">
                            Tổng thu nhập (Gross)
                          </span>
                          <span className="text-base font-bold text-slate-950">
                            {formatCurrency(
                              selectedItemPreview?.grossSalary ??
                                selectedPayrollItem.grossSalary,
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Khấu trừ (Deductions)
                    </p>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="space-y-4 text-sm text-slate-700">
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-medium text-slate-900">
                                Bảo hiểm bắt buộc
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                Được hệ thống tính từ attendance và payroll policy.
                              </p>
                            </div>
                            <span className="font-semibold text-slate-900">
                              -{formatCurrency(selectedItemMandatoryInsurance.total)}
                            </span>
                          </div>
                          <div className="mt-4 space-y-3 border-l-2 border-slate-200 pl-4 text-sm text-slate-600">
                            <div className="flex items-center justify-between gap-4">
                              <span>Mức đóng bảo hiểm</span>
                              <span className="font-medium text-slate-900">
                                {formatCurrency(selectedItemMandatoryInsurance.insuranceBase)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span>Bảo hiểm xã hội</span>
                              <span className="font-medium text-slate-900">
                                -{formatCurrency(selectedItemMandatoryInsurance.socialInsurance)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span>Bảo hiểm y tế</span>
                              <span className="font-medium text-slate-900">
                                -{formatCurrency(selectedItemMandatoryInsurance.healthInsurance)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span>Bảo hiểm thất nghiệp</span>
                              <span className="font-medium text-slate-900">
                                -{formatCurrency(
                                  selectedItemMandatoryInsurance.unemploymentInsurance,
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p>Thuế TNCN</p>
                            <p className="mt-1 text-xs text-slate-500">
                              Được hệ thống tính từ attendance và payroll settings.
                            </p>
                          </div>
                          <span className="font-semibold text-slate-900">
                            -{formatCurrency(
                              getSystemDeductions(selectedPayrollItem).personalIncomeTax,
                            )}
                          </span>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p>Khấu trừ khác</p>
                            <p className="mt-1 text-xs text-slate-500">
                              Khoản khấu trừ bổ sung do HR nhập thủ công.
                            </p>
                          </div>
                          {isPayrollDrawerEditing ? (
                            <input
                              type="number"
                              min={0}
                              value={payrollAdjustmentForm.otherDeduction}
                              onChange={event =>
                                setPayrollAdjustmentForm(current => {
                                  const otherDeduction = parsePayrollAmountInput(
                                    event.target.value,
                                  );

                                  return {
                                    ...current,
                                    otherDeduction,
                                    otherDeductionReason:
                                      otherDeduction > 0
                                        ? current.otherDeductionReason
                                        : '',
                                  };
                                })
                              }
                              className="w-36 rounded-lg border border-slate-200 px-3 py-2 text-right text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                            />
                          ) : (
                            <span className="font-semibold text-rose-600">
                              -{formatCurrency(
                                getManualAdjustments(selectedPayrollItem).otherDeduction,
                              )}
                            </span>
                          )}
                        </div>
                        <div className="border-t border-slate-100 pt-4">
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Lý do khấu trừ khác
                          </label>
                          {isPayrollDrawerEditing ? (
                            <>
                              <input
                                value={payrollAdjustmentForm.otherDeductionReason}
                                onChange={event =>
                                  setPayrollAdjustmentForm(current => ({
                                    ...current,
                                    otherDeductionReason: event.target.value,
                                  }))
                                }
                                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                                placeholder="Nhập lý do khấu trừ"
                              />
                              {isOtherDeductionReasonMissing ? (
                                <p className="mt-2 text-xs text-rose-600">
                                  Vui lòng nhập lý do khi có khấu trừ khác.
                                </p>
                              ) : null}
                            </>
                          ) : (
                            <p className="rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
                              {getManualAdjustments(selectedPayrollItem)
                                .otherDeductionReason || 'Không có lý do khấu trừ.'}
                            </p>
                          )}
                        </div>
                        <div className="border-t border-slate-100 pt-4">
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Ghi chú điều chỉnh
                          </label>
                          {isPayrollDrawerEditing ? (
                            <textarea
                              value={payrollAdjustmentForm.note}
                              onChange={event =>
                                setPayrollAdjustmentForm(current => ({
                                  ...current,
                                  note: event.target.value,
                                }))
                              }
                              rows={3}
                              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                              placeholder="Nhập lý do điều chỉnh nếu có"
                            />
                          ) : (
                            <p className="rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
                              {getManualAdjustments(selectedPayrollItem).note || 'Không có ghi chú điều chỉnh.'}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
                          <span className="font-semibold text-slate-900">Tổng khấu trừ</span>
                          <span className="text-base font-bold text-rose-600">
                            -{formatCurrency(
                              selectedItemPreview?.totalDeductions ??
                                selectedPayrollItem.totalDeductions,
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Tổng kết chấm công
                      </p>
                      <div className="mt-4 space-y-3 text-sm text-slate-700">
                        <div className="flex justify-between gap-4">
                          <span>Tổng số lượt chấm công</span>
                          <span className="font-semibold text-slate-900">
                            {selectedPayrollItem.attendanceSummary.totalAttendances}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Số lượt được trả lương</span>
                          <span className="font-semibold text-slate-900">
                            {selectedPayrollItem.attendanceSummary.payableAttendances}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Công quy đổi</span>
                          <span className="font-semibold text-slate-900">
                            {selectedPayrollItem.attendanceSummary.workedDayEquivalent.toFixed(
                              2,
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Số phút làm việc</span>
                          <span className="font-semibold text-slate-900">
                            {selectedPayrollItem.attendanceSummary.workedMinutes}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Bản ghi ngân hàng
                      </p>
                      <div className="mt-4 space-y-3 text-sm text-slate-700">
                        <div className="flex justify-between gap-4">
                          <span>Ngân hàng</span>
                          <span className="font-semibold text-slate-900">
                            {selectedPayrollItem.bankSnapshot.bankId || '--'}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Số tài khoản</span>
                          <span className="font-semibold text-slate-900">
                            {selectedPayrollItem.bankSnapshot.bankAccountNumber || '--'}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Tên tài khoản</span>
                          <span className="font-semibold text-slate-900">
                            {selectedPayrollItem.bankSnapshot.bankAccountName || '--'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 bg-slate-900 px-6 py-5 text-white">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-sm text-slate-300">Thực nhận (Net)</p>
                    <p className="mt-2 text-3xl font-bold text-emerald-400">
                      {formatCurrency(
                        selectedItemPreview?.netSalary ?? selectedPayrollItem.netSalary,
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    {canEditSelectedPayrollItem ? (
                      isPayrollDrawerEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              const manualAdjustments =
                                getManualAdjustments(selectedPayrollItem);
                              setPageActionError(null);
                              setPayrollAdjustmentForm({
                                allowance: manualAdjustments.allowance,
                                bonus: manualAdjustments.bonus,
                                otherDeduction: manualAdjustments.otherDeduction,
                                otherDeductionReason:
                                  manualAdjustments.otherDeductionReason,
                                note: manualAdjustments.note,
                              });
                              setIsPayrollDrawerEditing(false);
                            }}
                            className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleSavePayrollAdjustments()}
                            disabled={
                              isUpdatingManualAdjustments ||
                              isOtherDeductionReasonMissing ||
                              !!payrollAdjustmentAmountError
                            }
                            className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isUpdatingManualAdjustments ? 'Đang lưu...' : 'Lưu thay đổi'}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setPageActionError(null);
                            setIsPayrollDrawerEditing(true);
                          }}
                          className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
                        >
                          Sửa điều chỉnh HR
                        </button>
                      )
                    ) : (
                      <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-100">
                        Phiếu lương này chỉ có thể xem vì kỳ lương đã được khóa.
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => showDeferredFeatureAlert('Xuất PDF')}
                      className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500"
                    >
                      Xuất PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Tạo kỳ lương"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Mã kỳ
            </label>
            <input
              value={periodForm.code}
              onChange={event =>
                setPeriodForm(current => ({ ...current, code: event.target.value }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Tên kỳ
            </label>
            <input
              value={periodForm.name}
              onChange={event =>
                setPeriodForm(current => ({ ...current, name: event.target.value }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Bắt đầu kỳ
              </label>
              <input
                type="date"
                value={periodForm.periodStart}
                onChange={event =>
                  setPeriodForm(current => ({
                    ...current,
                    periodStart: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Kết thúc kỳ
              </label>
              <input
                type="date"
                value={periodForm.periodEnd}
                onChange={event =>
                  setPeriodForm(current => ({
                    ...current,
                    periodEnd: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Số ngày làm việc tiêu chuẩn
            </label>
            <input
              type="number"
              min={1}
              value={periodForm.standardWorkingDays}
              onChange={event =>
                setPeriodForm(current => ({
                  ...current,
                  standardWorkingDays: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => void handleCreatePeriod()}
              disabled={isCreatingPeriod}
              className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreatingPeriod ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Tạo
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={false && !!selectedPayrollItem}
        onClose={handleClosePayrollItem}
        title="Chi tiết mục lương"
        maxWidth="max-w-3xl"
      >
        {selectedPayrollItem ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {selectedPayrollItem.employeeName}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedPayrollItem.employeeCode} • Kỳ{' '}
                    {selectedPayrollItem.periodCode}
                  </p>
                </div>
                <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                  Chỉ xem
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Bản ghi lương
                </p>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <div className="flex justify-between gap-4">
                    <span>Lương cơ bản</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(selectedPayrollItem.baseSalarySnapshot)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Lương Gross</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(selectedPayrollItem.grossSalary)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Lương Net</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(selectedPayrollItem.netSalary)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Tổng kết chấm công
                </p>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <div className="flex justify-between gap-4">
                    <span>Tổng số lượt chấm công</span>
                    <span className="font-semibold text-slate-900">
                      {selectedPayrollItem.attendanceSummary.totalAttendances}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Số lượt chấm công được trả lương</span>
                    <span className="font-semibold text-slate-900">
                      {selectedPayrollItem.attendanceSummary.payableAttendances}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Số ngày làm việc tương đương</span>
                    <span className="font-semibold text-slate-900">
                      {selectedPayrollItem.attendanceSummary.workedDayEquivalent.toFixed(
                        2,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Số phút làm việc</span>
                    <span className="font-semibold text-slate-900">
                      {selectedPayrollItem.attendanceSummary.workedMinutes}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Bản ghi ngân hàng
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Ngân hàng
                  </p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {selectedPayrollItem.bankSnapshot.bankId || '--'}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Số tài khoản
                  </p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {selectedPayrollItem.bankSnapshot.bankAccountNumber || '--'}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Tên tài khoản
                  </p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {selectedPayrollItem.bankSnapshot.bankAccountName || '--'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Mục này chỉ có thể xem. Lương đã thanh toán sẽ không thể thay đổi.
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
