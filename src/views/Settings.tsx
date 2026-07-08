import { useEffect, useState } from 'react';
import { Clock, Loader2, Mail, MapPin, Save, Shield, ShieldAlert } from 'lucide-react';
import { useToast } from '../components/Toast';

import { mockShiftConfig } from '../mockData';
import {
  PayrollPolicyConfig,
  settingsService,
} from '../services/settings.service';
import {
  WorkLocationConfig,
  workLocationService,
} from '../services/work-location.service';

function showDeferredFeatureAlert(featureName: string) {
  window.alert(
    `${featureName} chưa được hỗ trợ trong sprint này. Vui lòng thảo luận về quy trình mục tiêu trước khi chúng ta kết nối khu vực cài đặt này với các API trực tiếp.`,
  );
}

const roleScopeRows = [
  {
    area: 'Danh mục nhân viên',
    currentScope: 'Trực tiếp',
    note: 'Đã kết nối trực tiếp cho Super Admin.',
  },
  {
    area: 'Xem xét chấm công',
    currentScope: 'Trực tiếp',
    note: 'Xem tổng quan công ty hiện chỉ dành cho Super Admin.',
  },
  {
    area: 'Thao tác quản lý lương',
    currentScope: 'Một phần',
    note: 'Chỉ Super Admin có quyền quản lý lương.',
  },
  {
    area: 'Ma trận quyền có thể chỉnh sửa',
    currentScope: 'Tạm hoãn',
    note: 'Chỉnh sửa quyền trực tiếp nằm ngoài phạm vi sprint hiện tại.',
  },
];

const defaultPayrollPolicy: PayrollPolicyConfig = {
  standardWorkingDaysInMonth: 22,
  insuranceBaseSource: 'BASE_SALARY',
  employeeInsuranceRates: {
    socialInsurance: 0,
    healthInsurance: 0,
    unemploymentInsurance: 0,
  },
  employerInsuranceRates: {
    socialInsurance: 0,
    healthInsurance: 0,
    unemploymentInsurance: 0,
    occupationalAccidentInsurance: 0,
  },
  insuranceSalaryCap: null,
  regionalMinimumWage: null,
  validationRules: {
    warnIfInsuranceBaseBelowRegionalMinimum: true,
    warnIfNetSalaryNegative: true,
    warnIfPayrollVariancePercentExceeds: 10,
  },
};

type PayrollPolicyInputState = {
  standardWorkingDaysInMonth: string;
  insuranceSalaryCap: string;
  regionalMinimumWage: string;
  employeeSocialInsurance: string;
  employeeHealthInsurance: string;
  employeeUnemploymentInsurance: string;
  employerSocialInsurance: string;
  employerHealthInsurance: string;
  employerUnemploymentInsurance: string;
  employerOccupationalAccidentInsurance: string;
  warnIfPayrollVariancePercentExceeds: string;
};

function toPayrollPolicyInputState(
  policy: PayrollPolicyConfig,
): PayrollPolicyInputState {
  return {
    standardWorkingDaysInMonth: String(policy.standardWorkingDaysInMonth),
    insuranceSalaryCap:
      policy.insuranceSalaryCap === null
        ? ''
        : String(policy.insuranceSalaryCap),
    regionalMinimumWage:
      policy.regionalMinimumWage === null
        ? ''
        : String(policy.regionalMinimumWage),
    employeeSocialInsurance: String(
      policy.employeeInsuranceRates.socialInsurance,
    ),
    employeeHealthInsurance: String(
      policy.employeeInsuranceRates.healthInsurance,
    ),
    employeeUnemploymentInsurance: String(
      policy.employeeInsuranceRates.unemploymentInsurance,
    ),
    employerSocialInsurance: String(
      policy.employerInsuranceRates.socialInsurance,
    ),
    employerHealthInsurance: String(
      policy.employerInsuranceRates.healthInsurance,
    ),
    employerUnemploymentInsurance: String(
      policy.employerInsuranceRates.unemploymentInsurance,
    ),
    employerOccupationalAccidentInsurance: String(
      policy.employerInsuranceRates.occupationalAccidentInsurance,
    ),
    warnIfPayrollVariancePercentExceeds:
      policy.validationRules.warnIfPayrollVariancePercentExceeds === null
        ? ''
        : String(policy.validationRules.warnIfPayrollVariancePercentExceeds),
  };
}

function parseNumberInput(value: string): number | undefined {
  const trimmedValue = value.trim();
  if (trimmedValue === '') {
    return undefined;
  }

  const parsedValue = Number(trimmedValue);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

function parseRequiredPositiveInteger(value: string): number | undefined {
  const parsedValue = parseNumberInput(value);
  return parsedValue !== undefined &&
    Number.isInteger(parsedValue) &&
    parsedValue >= 1
    ? parsedValue
    : undefined;
}

function parseRequiredNonNegativeNumber(value: string): number | undefined {
  const parsedValue = parseNumberInput(value);
  return parsedValue !== undefined && parsedValue >= 0
    ? parsedValue
    : undefined;
}

function parseNullableNumber(value: string): number | null | undefined {
  const trimmedValue = value.trim();
  if (trimmedValue === '') {
    return null;
  }

  const parsedValue = Number(trimmedValue);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

function parseNullableNonNegativeNumber(
  value: string,
): number | null | undefined {
  const parsedValue = parseNullableNumber(value);
  if (parsedValue === null) {
    return null;
  }

  return parsedValue !== undefined && parsedValue >= 0
    ? parsedValue
    : undefined;
}

function getPayrollInputClass(hasError: boolean, isReadOnly = false): string {
  const stateClasses = isReadOnly
    ? 'border-slate-200 bg-slate-50 text-slate-600'
    : hasError
      ? 'border-rose-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/10'
      : 'border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10';

  return `w-full rounded-lg px-3 py-2 text-sm outline-none disabled:bg-slate-50 disabled:text-slate-400 ${stateClasses}`;
}

export default function Settings() {
  const { showToast } = useToast();
  const [payrollPolicy, setPayrollPolicy] = useState<PayrollPolicyConfig>(
    defaultPayrollPolicy,
  );
  const [payrollPolicyInputs, setPayrollPolicyInputs] =
    useState<PayrollPolicyInputState>(() =>
      toPayrollPolicyInputState(defaultPayrollPolicy),
    );
  const [hasLoadedPayrollPolicy, setHasLoadedPayrollPolicy] = useState(false);
  const [isLoadingPayroll, setIsLoadingPayroll] = useState(true);
  const [isSavingPayroll, setIsSavingPayroll] = useState(false);
  const [payrollSaveError, setPayrollSaveError] = useState<string | null>(null);
  const [locationConfig, setLocationConfig] = useState<WorkLocationConfig>({
    officeIp: '',
    wifiSsid: '',
    gpsLat: undefined,
    gpsLng: undefined,
    gpsRadiusMeters: 100,
  });
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [locationSaveError, setLocationSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingPayroll(true);
    settingsService
      .getPayrollPolicy()
      .then(policy => {
        if (cancelled) return;
        setPayrollPolicy(policy);
        setPayrollPolicyInputs(toPayrollPolicyInputState(policy));
        setHasLoadedPayrollPolicy(true);
        setPayrollSaveError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setHasLoadedPayrollPolicy(false);
        setPayrollSaveError('Không thể tải chính sách lương.');
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingPayroll(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingLocation(true);
    workLocationService.getActive().then(config => {
      if (cancelled) return;
      if (config) {
        setLocationConfig({
          officeIp: config.officeIp ?? '',
          wifiSsid: config.wifiSsid ?? '',
          gpsLat: config.gpsLat ?? undefined,
          gpsLng: config.gpsLng ?? undefined,
          gpsRadiusMeters: config.gpsRadiusMeters ?? 100,
        });
      }
      setIsLoadingLocation(false);
    });
    return () => { cancelled = true; };
  }, []);

  const handleSavePayrollPolicy = async () => {
    if (!hasLoadedPayrollPolicy || hasPayrollValidationError) {
      setPayrollSaveError(
        !hasLoadedPayrollPolicy
          ? 'Không thể tải chính sách lương, nên chức năng lưu đã bị vô hiệu hóa.'
          : 'Vui lòng sửa các giá trị chính sách lương không hợp lệ trước khi lưu.',
      );
      return;
    }

    setIsSavingPayroll(true);
    setPayrollSaveError(null);
    try {
      const saved = await settingsService.savePayrollPolicy(payrollPolicy);
      setPayrollPolicy(saved);
      setPayrollPolicyInputs(toPayrollPolicyInputState(saved));
      setHasLoadedPayrollPolicy(true);
      showToast({ type: 'success', message: 'Đã lưu chính sách lương thành công.' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể lưu chính sách lương.';
      setPayrollSaveError(msg);
      showToast({ type: 'error', message: msg });
    } finally {
      setIsSavingPayroll(false);
    }
  };

  const standardWorkingDaysError =
    parseRequiredPositiveInteger(payrollPolicyInputs.standardWorkingDaysInMonth) ===
    undefined;
  const insuranceSalaryCapError =
    parseNullableNonNegativeNumber(payrollPolicyInputs.insuranceSalaryCap) ===
    undefined;
  const regionalMinimumWageError =
    parseNullableNonNegativeNumber(payrollPolicyInputs.regionalMinimumWage) ===
    undefined;
  const employeeSocialInsuranceError =
    parseRequiredNonNegativeNumber(payrollPolicyInputs.employeeSocialInsurance) ===
    undefined;
  const employeeHealthInsuranceError =
    parseRequiredNonNegativeNumber(payrollPolicyInputs.employeeHealthInsurance) ===
    undefined;
  const employeeUnemploymentInsuranceError =
    parseRequiredNonNegativeNumber(
      payrollPolicyInputs.employeeUnemploymentInsurance,
    ) === undefined;
  const employerSocialInsuranceError =
    parseRequiredNonNegativeNumber(payrollPolicyInputs.employerSocialInsurance) ===
    undefined;
  const employerHealthInsuranceError =
    parseRequiredNonNegativeNumber(payrollPolicyInputs.employerHealthInsurance) ===
    undefined;
  const employerUnemploymentInsuranceError =
    parseRequiredNonNegativeNumber(
      payrollPolicyInputs.employerUnemploymentInsurance,
    ) === undefined;
  const employerOccupationalAccidentInsuranceError =
    parseRequiredNonNegativeNumber(
      payrollPolicyInputs.employerOccupationalAccidentInsurance,
    ) === undefined;
  const hasPayrollValidationError =
    standardWorkingDaysError ||
    insuranceSalaryCapError ||
    regionalMinimumWageError ||
    employeeSocialInsuranceError ||
    employeeHealthInsuranceError ||
    employeeUnemploymentInsuranceError ||
    employerSocialInsuranceError ||
    employerHealthInsuranceError ||
    employerUnemploymentInsuranceError ||
    employerOccupationalAccidentInsuranceError;

  const handleStandardWorkingDaysChange = (value: string) => {
    setPayrollPolicyInputs(current => ({
      ...current,
      standardWorkingDaysInMonth: value,
    }));

    const parsedValue = parseRequiredPositiveInteger(value);
    if (parsedValue === undefined) {
      return;
    }

    setPayrollPolicy(current => ({
      ...current,
      standardWorkingDaysInMonth: parsedValue,
    }));
  };

  const handleNullableFieldChange = (
    field: 'insuranceSalaryCap' | 'regionalMinimumWage',
    value: string,
  ) => {
    setPayrollPolicyInputs(current => ({
      ...current,
      [field]: value,
    }));

    const parsedValue = parseNullableNonNegativeNumber(value);
    if (parsedValue === undefined) {
      return;
    }

    setPayrollPolicy(current => ({
      ...current,
      [field]: parsedValue,
    }));
  };

  const handleEmployeeRateChange = (
    field:
      | 'socialInsurance'
      | 'healthInsurance'
      | 'unemploymentInsurance',
    inputField:
      | 'employeeSocialInsurance'
      | 'employeeHealthInsurance'
      | 'employeeUnemploymentInsurance',
    value: string,
  ) => {
    setPayrollPolicyInputs(current => ({
      ...current,
      [inputField]: value,
    }));

    const parsedValue = parseRequiredNonNegativeNumber(value);
    if (parsedValue === undefined) {
      return;
    }

    setPayrollPolicy(current => ({
      ...current,
      employeeInsuranceRates: {
        ...current.employeeInsuranceRates,
        [field]: parsedValue,
      },
    }));
  };

  const handleEmployerRateChange = (
    field:
      | 'socialInsurance'
      | 'healthInsurance'
      | 'unemploymentInsurance'
      | 'occupationalAccidentInsurance',
    inputField:
      | 'employerSocialInsurance'
      | 'employerHealthInsurance'
      | 'employerUnemploymentInsurance'
      | 'employerOccupationalAccidentInsurance',
    value: string,
  ) => {
    setPayrollPolicyInputs(current => ({
      ...current,
      [inputField]: value,
    }));

    const parsedValue = parseRequiredNonNegativeNumber(value);
    if (parsedValue === undefined) {
      return;
    }

    setPayrollPolicy(current => ({
      ...current,
      employerInsuranceRates: {
        ...current.employerInsuranceRates,
        [field]: parsedValue,
      },
    }));
  };

  const handleSaveLocation = async () => {
    setIsSavingLocation(true);
    setLocationSaveError(null);
    try {
      await workLocationService.saveConfig({
        officeIp: locationConfig.officeIp || null,
        wifiSsid: locationConfig.wifiSsid || null,
        gpsLat: locationConfig.gpsLat ?? null,
        gpsLng: locationConfig.gpsLng ?? null,
        gpsRadiusMeters: locationConfig.gpsRadiusMeters ?? 100,
      });
      showToast({ type: 'success', message: 'Đã lưu cấu hình vị trí làm việc thành công.' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể lưu cấu hình.';
      setLocationSaveError(msg);
      showToast({ type: 'error', message: msg });
    } finally {
      setIsSavingLocation(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-amber-950">
              Cài đặt — một phần vẫn đang được phát triển
            </h1>
            <p className="mt-2 text-sm text-amber-800">
              Cấu hình vị trí làm việc đã được kết nối API. Các phần còn lại như
              ca làm việc, email công ty và quyền truy cập vẫn ở chế độ chỉ xem.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center">
              <div className="mr-3 rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Chính sách lương
                </h2>
                <p className="text-xs text-slate-500">
                  Chính sách lương áp dụng toàn công ty, dành cho Super Admin.
                </p>
              </div>
            </div>
            {isLoadingPayroll ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            ) : null}
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
              <p className="font-medium">Chỉ dành cho Super Admin</p>
              <p className="mt-1 text-emerald-800">
                Trình chỉnh sửa này quản lý chính sách lương đang áp dụng của
                công ty. Tính năng tự động tính thuế TNCN chưa được đưa vào giai đoạn này.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Số ngày làm việc chuẩn trong tháng
                </label>
                <input
                  type="number"
                  min={1}
                  value={payrollPolicyInputs.standardWorkingDaysInMonth}
                  onChange={event =>
                    handleStandardWorkingDaysChange(event.target.value)
                  }
                  disabled={isLoadingPayroll || isSavingPayroll}
                  className={getPayrollInputClass(standardWorkingDaysError)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Nguồn tính mức đóng bảo hiểm
                </label>
                <input
                  type="text"
                  readOnly
                  value={payrollPolicy.insuranceBaseSource}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Mức lương đóng bảo hiểm tối đa
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  placeholder="Không bắt buộc"
                  value={payrollPolicyInputs.insuranceSalaryCap}
                  onChange={event =>
                    handleNullableFieldChange(
                      'insuranceSalaryCap',
                      event.target.value,
                    )
                  }
                  disabled={isLoadingPayroll || isSavingPayroll}
                  className={getPayrollInputClass(insuranceSalaryCapError)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Lương tối thiểu vùng
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  placeholder="Không bắt buộc"
                  value={payrollPolicyInputs.regionalMinimumWage}
                  onChange={event =>
                    handleNullableFieldChange(
                      'regionalMinimumWage',
                      event.target.value,
                    )
                  }
                  disabled={isLoadingPayroll || isSavingPayroll}
                  className={getPayrollInputClass(regionalMinimumWageError)}
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Tỷ lệ bảo hiểm người lao động
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Nhập tỷ lệ dạng thập phân, ví dụ 0.08 cho 8%.
                </p>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Bảo hiểm xã hội
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.001"
                    value={payrollPolicyInputs.employeeSocialInsurance}
                    onChange={event =>
                      handleEmployeeRateChange(
                        'socialInsurance',
                        'employeeSocialInsurance',
                        event.target.value,
                      )
                    }
                    disabled={isLoadingPayroll || isSavingPayroll}
                    className={getPayrollInputClass(employeeSocialInsuranceError)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Bảo hiểm y tế
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.001"
                    value={payrollPolicyInputs.employeeHealthInsurance}
                    onChange={event =>
                      handleEmployeeRateChange(
                        'healthInsurance',
                        'employeeHealthInsurance',
                        event.target.value,
                      )
                    }
                    disabled={isLoadingPayroll || isSavingPayroll}
                    className={getPayrollInputClass(employeeHealthInsuranceError)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Bảo hiểm thất nghiệp
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.001"
                    value={payrollPolicyInputs.employeeUnemploymentInsurance}
                    onChange={event =>
                      handleEmployeeRateChange(
                        'unemploymentInsurance',
                        'employeeUnemploymentInsurance',
                        event.target.value,
                      )
                    }
                    disabled={isLoadingPayroll || isSavingPayroll}
                    className={getPayrollInputClass(
                      employeeUnemploymentInsuranceError,
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Tỷ lệ bảo hiểm người sử dụng lao động
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Giữ các giá trị này khớp với chính sách chung của công ty.
                </p>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Bảo hiểm xã hội
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.001"
                    value={payrollPolicyInputs.employerSocialInsurance}
                    onChange={event =>
                      handleEmployerRateChange(
                        'socialInsurance',
                        'employerSocialInsurance',
                        event.target.value,
                      )
                    }
                    disabled={isLoadingPayroll || isSavingPayroll}
                    className={getPayrollInputClass(employerSocialInsuranceError)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Bảo hiểm y tế
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.001"
                    value={payrollPolicyInputs.employerHealthInsurance}
                    onChange={event =>
                      handleEmployerRateChange(
                        'healthInsurance',
                        'employerHealthInsurance',
                        event.target.value,
                      )
                    }
                    disabled={isLoadingPayroll || isSavingPayroll}
                    className={getPayrollInputClass(employerHealthInsuranceError)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Bảo hiểm thất nghiệp
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.001"
                    value={payrollPolicyInputs.employerUnemploymentInsurance}
                    onChange={event =>
                      handleEmployerRateChange(
                        'unemploymentInsurance',
                        'employerUnemploymentInsurance',
                        event.target.value,
                      )
                    }
                    disabled={isLoadingPayroll || isSavingPayroll}
                    className={getPayrollInputClass(
                      employerUnemploymentInsuranceError,
                    )}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Bảo hiểm tai nạn lao động
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.001"
                    value={payrollPolicyInputs.employerOccupationalAccidentInsurance}
                    onChange={event =>
                      handleEmployerRateChange(
                        'occupationalAccidentInsurance',
                        'employerOccupationalAccidentInsurance',
                        event.target.value,
                      )
                    }
                    disabled={isLoadingPayroll || isSavingPayroll}
                    className={getPayrollInputClass(
                      employerOccupationalAccidentInsuranceError,
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Quy tắc kiểm tra
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Các cảnh báo hỗ trợ việc rà soát lương. Tính năng tự động
                  tính thuế TNCN vẫn nằm ngoài phạm vi của giai đoạn này.
                </p>
              </div>
              <div className="mt-4 space-y-3">
                <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={
                      payrollPolicy.validationRules
                        .warnIfInsuranceBaseBelowRegionalMinimum
                    }
                    onChange={event =>
                      setPayrollPolicy(current => ({
                        ...current,
                        validationRules: {
                          ...current.validationRules,
                          warnIfInsuranceBaseBelowRegionalMinimum:
                            event.target.checked,
                        },
                      }))
                    }
                    disabled={isLoadingPayroll || isSavingPayroll}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Cảnh báo nếu mức đóng bảo hiểm thấp hơn lương tối thiểu vùng.</span>
                </label>
                <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={payrollPolicy.validationRules.warnIfNetSalaryNegative}
                    onChange={event =>
                      setPayrollPolicy(current => ({
                        ...current,
                        validationRules: {
                          ...current.validationRules,
                          warnIfNetSalaryNegative: event.target.checked,
                        },
                      }))
                    }
                    disabled={isLoadingPayroll || isSavingPayroll}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Cảnh báo nếu lương thực nhận bị âm.</span>
                </label>
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <label className="block text-xs font-medium text-amber-950">
                        Cảnh báo nếu chênh lệch lương vượt quá phần trăm
                      </label>
                      <p className="mt-1 text-xs text-amber-800">
                        Tạm hoãn sang giai đoạn sau. Ngưỡng này chỉ hiển thị để
                        tham khảo và chưa được áp dụng bởi quy trình lương
                        hiện tại.
                      </p>
                    </div>
                    <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
                      Tạm hoãn
                    </span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    value={payrollPolicyInputs.warnIfPayrollVariancePercentExceeds}
                    readOnly
                    disabled
                    className={`${getPayrollInputClass(false, true)} mt-3`}
                  />
                </div>
              </div>
            </div>

            {payrollSaveError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
                {payrollSaveError}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => void handleSavePayrollPolicy()}
              disabled={
                isSavingPayroll ||
                isLoadingPayroll ||
                !hasLoadedPayrollPolicy ||
                hasPayrollValidationError
              }
              className="inline-flex w-full items-center justify-center rounded-md bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingPayroll ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isSavingPayroll ? 'Đang lưu...' : 'Lưu chính sách lương'}
            </button>
          </div>
        </div>

        {/* Cấu hình ca làm việc — chỉ xem */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center">
            <div className="mr-3 rounded-lg bg-blue-50 p-2 text-blue-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Cấu hình ca làm việc
              </h2>
              <p className="text-xs text-slate-500">
                Giá trị nguyên mẫu. Giao diện quản trị trực tiếp vẫn đang phát triển.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Giờ bắt đầu
                </label>
                <input
                  type="time"
                  readOnly
                  value={mockShiftConfig.startTime}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Giờ kết thúc
                </label>
                <input
                  type="time"
                  readOnly
                  value={mockShiftConfig.endTime}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Bắt đầu nghỉ trưa
                </label>
                <input
                  type="time"
                  readOnly
                  value={mockShiftConfig.breakStartTime}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Kết thúc nghỉ trưa
                </label>
                <input
                  type="time"
                  readOnly
                  value={mockShiftConfig.breakEndTime}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Số ngày làm việc tối thiểu mỗi tháng
              </label>
              <input
                type="number"
                readOnly
                value={mockShiftConfig.minWorkingDaysPerMonth}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => showDeferredFeatureAlert('Cài đặt ca làm việc')}
              className="w-full rounded-md border border-slate-200 bg-slate-100 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Thảo luận cài đặt ca làm việc trực tiếp
            </button>
          </div>
        </div>

        {/* Email công ty — chỉ xem */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center">
            <div className="mr-3 rounded-lg bg-purple-50 p-2 text-purple-600">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Cấu hình email công ty
              </h2>
              <p className="text-xs text-slate-500">
                Vẫn chỉ là nguyên mẫu trong sprint này.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Tên miền chính
              </label>
              <input
                type="text"
                readOnly
                value="nova.com"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 outline-none"
              />
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Tự động cấp phát email công ty vẫn đang được phát triển. Sprint hiện tại
              chỉ triển khai CRUD nhân viên và ranh giới thông tin nhạy cảm.
            </div>
            <button
              type="button"
              onClick={() => showDeferredFeatureAlert('Cài đặt tên miền email')}
              className="w-full rounded-md border border-slate-200 bg-slate-100 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Thảo luận cài đặt email
            </button>
          </div>
        </div>

        {/* Vị trí làm việc — TRỰC TIẾP */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center">
              <div className="mr-3 rounded-lg bg-orange-50 p-2 text-orange-600">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Vị trí làm việc
                </h2>
                <p className="text-xs text-slate-500">
                  Cấu hình trực tiếp — thay đổi sẽ ảnh hưởng đến dữ liệu metadata chấm công.
                </p>
              </div>
            </div>
            {isLoadingLocation && (
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                IP công khai của văn phòng
              </label>
              <input
                type="text"
                placeholder="VD: 203.0.113.10"
                value={locationConfig.officeIp ?? ''}
                onChange={e =>
                  setLocationConfig(c => ({ ...c, officeIp: e.target.value }))
                }
                disabled={isLoadingLocation}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/10 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Wi-Fi SSID của văn phòng
              </label>
              <input
                type="text"
                placeholder="VD: CompanyWiFi_5G"
                value={locationConfig.wifiSsid ?? ''}
                onChange={e =>
                  setLocationConfig(c => ({ ...c, wifiSsid: e.target.value }))
                }
                disabled={isLoadingLocation}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/10 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  GPS Vĩ độ (Lat)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="VD: 10.7769"
                  value={locationConfig.gpsLat ?? ''}
                  onChange={e =>
                    setLocationConfig(c => ({
                      ...c,
                      gpsLat: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                  disabled={isLoadingLocation}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/10 disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  GPS Kinh độ (Lng)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="VD: 106.7009"
                  value={locationConfig.gpsLng ?? ''}
                  onChange={e =>
                    setLocationConfig(c => ({
                      ...c,
                      gpsLng: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                  disabled={isLoadingLocation}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/10 disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Bán kính GPS (mét)
              </label>
              <input
                type="number"
                min={10}
                placeholder="100"
                value={locationConfig.gpsRadiusMeters ?? 100}
                onChange={e =>
                  setLocationConfig(c => ({
                    ...c,
                    gpsRadiusMeters: Number(e.target.value),
                  }))
                }
                disabled={isLoadingLocation}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/10 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>

            {locationSaveError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
                {locationSaveError}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => void handleSaveLocation()}
              disabled={isSavingLocation || isLoadingLocation}
              className="inline-flex w-full items-center justify-center rounded-md bg-orange-600 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingLocation ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isSavingLocation ? 'Đang lưu...' : 'Lưu cấu hình'}
            </button>
          </div>
        </div>

        {/* Tổng quan quyền truy cập */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center">
            <div className="mr-3 rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Tổng quan quyền truy cập
              </h2>
              <p className="text-xs text-slate-500">
                Snapshot chỉ đọc cho bàn giao sprint.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {roleScopeRows.map(row => (
              <div
                key={row.area}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {row.area}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">{row.note}</p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      row.currentScope === 'Trực tiếp'
                        ? 'bg-emerald-100 text-emerald-700'
                        : row.currentScope === 'Một phần'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {row.currentScope}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => showDeferredFeatureAlert('Ma trận quyền có thể chỉnh sửa')}
            className="mt-5 w-full rounded-md border border-slate-200 bg-slate-100 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            Thảo luận ma trận quyền trước khi bật
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Tạm hoãn từ giao diện cài đặt cũ
        </h2>
        <ul className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
          <li className="rounded-lg bg-slate-50 px-4 py-3">
            Màn hình cấu hình ca làm việc có thể chỉnh sửa
          </li>
          <li className="rounded-lg bg-slate-50 px-4 py-3">
            Luồng quản lý tên miền email công ty
          </li>
          <li className="rounded-lg bg-slate-50 px-4 py-3">
            ✓ Trình chỉnh sửa vị trí IP / Wi-Fi / GPS đã được kết nối live
          </li>
          <li className="rounded-lg bg-slate-50 px-4 py-3">
            Ma trận quyền có thể chỉnh sửa
          </li>
        </ul>
      </div>
    </div>
  );
}
