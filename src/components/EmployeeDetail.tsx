import {
  ArrowLeft,
  Briefcase,
  Building,
  CreditCard,
  Edit2,
  Mail,
  MapPin,
  Phone,
  Shield,
  ShieldBan,
  UserSquare2,
} from 'lucide-react';

import {
  Department,
  Employee,
  EmployeeSensitiveInfo,
  Position,
  Role,
} from '../types';

interface EmployeeDetailProps {
  employee: Employee;
  department?: Department | null;
  position?: Position | null;
  userRole: Role;
  sensitiveInfo?: EmployeeSensitiveInfo | null;
  isSensitiveLoading?: boolean;
  sensitiveError?: string | null;
  onBack: () => void;
  onEdit: (employee: Employee) => void;
  onDisable?: (employee: Employee) => void;
}

function formatCurrency(amount?: number) {
  if (amount === undefined || amount === null) {
    return 'Not updated';
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

function formatDate(value: string) {
  if (!value) {
    return 'Not updated';
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString('vi-VN');
}

function formatWorkStatusLabel(status: Employee['workStatus']) {
  return status.replace('_', ' ');
}

export default function EmployeeDetail({
  employee,
  department,
  position,
  userRole,
  sensitiveInfo,
  isSensitiveLoading = false,
  sensitiveError = null,
  onBack,
  onEdit,
  onDisable,
}: EmployeeDetailProps) {
  const canManageBasicInfo =
    userRole === 'Super Admin' || userRole === 'HR Admin';
  const canViewSensitiveInfo =
    userRole === 'Super Admin' || userRole === 'HR Admin';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-4 p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Employee profile
            </h2>
            <p className="text-xs text-slate-500">
              Basic information and role-gated compensation data
            </p>
          </div>
        </div>
        {canManageBasicInfo ? (
          <div className="flex items-center gap-3">
            {employee.isActive !== false ? (
              <button
                onClick={() => onDisable?.(employee)}
                className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-sm font-medium hover:bg-rose-100 transition-colors"
              >
                <ShieldBan className="w-4 h-4" />
                Disable employee
              </button>
            ) : null}
            <button
              onClick={() => onEdit(employee)}
              disabled={employee.isActive === false}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 flex items-center transition-colors disabled:opacity-60"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit employee
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex-1 overflow-auto p-6 bg-slate-50/30">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="w-24 h-24 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-3xl font-bold flex-shrink-0">
              {employee.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    {employee.name}
                  </h1>
                  <p className="text-slate-500 flex items-center mt-1">
                    <Mail className="w-4 h-4 mr-1.5" /> {employee.companyEmail}
                  </p>
                  <p className="text-slate-500 flex items-center mt-1">
                    <Phone className="w-4 h-4 mr-1.5" /> {employee.phone}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 uppercase border border-blue-100">
                    {employee.role}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase border ${employee.isActive === false
                      ? 'bg-slate-100 text-slate-600 border-slate-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      }`}
                  >
                    {employee.isActive === false
                      ? 'Record inactive'
                      : 'Record active'}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase border ${employee.workStatus === 'ACTIVE'
                      ? 'bg-green-50 text-green-700 border-green-100'
                      : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}
                  >
                    {`Work ${formatWorkStatusLabel(employee.workStatus)}`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
                <Briefcase className="w-5 h-5 mr-2 text-slate-400" />
                Work information
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Employee code
                  </p>
                  <p className="text-sm font-medium text-slate-900 flex items-center">
                    <UserSquare2 className="w-4 h-4 mr-2 text-slate-400" />
                    {employee.code}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Department
                  </p>
                  <p className="text-sm font-medium text-slate-900 flex items-center">
                    <Building className="w-4 h-4 mr-2 text-slate-400" />
                    {department?.name || 'Unassigned'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Position
                  </p>
                  <p className="text-sm font-medium text-slate-900 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                    {position?.title || 'Unassigned'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Join date
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {formatDate(employee.joinDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Personal email
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {employee.personalEmail || 'Not updated'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden min-h-[20rem]">
              <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-slate-400" />
                Compensation and bank info
              </h3>

              {!canViewSensitiveInfo ? (
                <div className="absolute inset-0 bg-slate-50/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
                  <Shield className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-sm font-medium text-slate-700">
                    Sensitive information is restricted
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Live salary and bank data are currently available to Super
                    Admin and HR Admin only in this frontend flow.
                  </p>
                </div>
              ) : null}

              {canViewSensitiveInfo ? (
                <div className="space-y-4">
                  {isSensitiveLoading ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      Loading sensitive information...
                    </div>
                  ) : null}

                  {sensitiveError ? (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {sensitiveError}
                    </div>
                  ) : null}

                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                      Base salary
                    </p>
                    <p className="text-sm font-medium text-slate-900">
                      {formatCurrency(sensitiveInfo?.baseSalary)}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                      Bank account
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-slate-500 block mb-0.5">
                          Bank
                        </span>
                        <span className="font-medium">
                          {sensitiveInfo?.bankId || 'Not updated'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-0.5">
                          Account number
                        </span>
                        <span className="font-mono font-medium">
                          {sensitiveInfo?.bankAccountNumber || 'Not updated'}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500 block mb-0.5">
                          Account holder
                        </span>
                        <span className="font-medium">
                          {sensitiveInfo?.bankAccountName || 'Not updated'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
