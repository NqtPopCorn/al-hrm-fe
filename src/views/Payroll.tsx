import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Calendar,
  CreditCard,
  Download,
  FileText,
  History,
  LoaderCircle,
  Plus,
  Receipt,
  ShieldAlert,
} from 'lucide-react';

import Modal from '../components/Modal';
import { usePayroll } from '../hooks/usePayroll';
import {
  PayrollItem,
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
  const isSuperAdmin = userRole === 'Super Admin';
  const isEmployee = userRole === 'Employee';
  const canUseLiveAdminPayroll = isSuperAdmin;
  const canUseLiveSelfPayroll = isEmployee;

  const [activeTab, setActiveTab] = useState<PayrollTab>(
    isEmployee ? 'history' : 'current',
  );
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [pageActionError, setPageActionError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPayrollItem, setSelectedPayrollItem] = useState<PayrollItem | null>(
    null,
  );
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
    isCreatingPeriod,
    isCalculatingPeriod,
    isReviewingPeriod,
    isApprovingPeriod,
    isMarkingPaid,
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
  const totalNetSalary = selectedPeriodItems.reduce(
    (sum, item) => sum + item.netSalary,
    0,
  );
  const totalGrossSalary = selectedPeriodItems.reduce(
    (sum, item) => sum + item.grossSalary,
    0,
  );
  const nextPayrollAction = selectedPeriodSummary
    ? getNextPayrollAction(selectedPeriodSummary.status)
    : null;

  const pageError = periodsError || periodError || myPayrollError || pageActionError;
  const isBusy =
    isCreatingPeriod ||
    isCalculatingPeriod ||
    isReviewingPeriod ||
    isApprovingPeriod ||
    isMarkingPaid;

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
    } catch (error) {
      setPageActionError(
        error instanceof Error ? error.message : 'Unable to create payroll period.',
      );
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
    } catch (error) {
      setPageActionError(
        error instanceof Error ? error.message : 'Unable to update payroll status.',
      );
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
        <div className="grid gap-6 xl:grid-cols-[1.15fr_1.85fr]">
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
                              onClick={() => setSelectedPayrollItem(item)}
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
                  onClick={() => setSelectedPayrollItem(sortedMyPayrollItems[0])}
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
                            onClick={() => setSelectedPayrollItem(item)}
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
        isOpen={!!selectedPayrollItem}
        onClose={() => setSelectedPayrollItem(null)}
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
