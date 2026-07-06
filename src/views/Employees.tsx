import { FormEvent, useEffect, useState } from 'react';
import { Edit2, Eye, Mail, Plus, Search, Upload } from 'lucide-react';

import EmployeeDetail from '../components/EmployeeDetail';
import EmployeeImportModal from '../components/EmployeeImportModal';
import Modal from '../components/Modal';
import { useDepartments } from '../hooks/useDepartments';
import { useEmployees } from '../hooks/useEmployees';
import { usePositions } from '../hooks/usePositions';
import { ApiError } from '../lib/api';
import {
  EmployeeImportRowError,
  EmployeeSensitiveUpsertPayload,
  EmployeeUpsertPayload,
} from '../services/employee.service';
import {
  CompanyEmailStatus,
  Department,
  Employee,
  EmployeeSensitiveInfo,
  EmployeeWorkStatus,
  Position,
  Role,
} from '../types';

type EmployeeFormState = {
  code: string;
  name: string;
  personalEmail: string;
  companyEmail: string;
  phone: string;
  role: Role;
  departmentId: string;
  positionId: string;
  workStatus: EmployeeWorkStatus;
  emailStatus: CompanyEmailStatus;
  joinDate: string;
  baseSalary: string;
  bankId: string;
  bankAccountNumber: string;
  bankAccountName: string;
};

const workStatusOptions: EmployeeWorkStatus[] = [
  'PROBATION',
  'ACTIVE',
  'ON_LEAVE',
  'RESIGNED',
  'TERMINATED',
  'INACTIVE',
];

const emailStatusOptions: CompanyEmailStatus[] = [
  'ACTIVE',
  'SUSPENDED',
  'DEACTIVATED',
];

function getDefaultJoinDate() {
  return new Date().toISOString().slice(0, 10);
}

function createEmptyEmployeeForm(): EmployeeFormState {
  return {
    code: '',
    name: '',
    personalEmail: '',
    companyEmail: '',
    phone: '',
    role: 'Employee',
    departmentId: '',
    positionId: '',
    workStatus: 'ACTIVE',
    emailStatus: 'ACTIVE',
    joinDate: getDefaultJoinDate(),
    baseSalary: '',
    bankId: '',
    bankAccountNumber: '',
    bankAccountName: '',
  };
}

function buildEmployeeForm(
  employee: Employee,
  sensitiveInfo?: EmployeeSensitiveInfo | null,
): EmployeeFormState {
  return {
    code: employee.code,
    name: employee.name,
    personalEmail: employee.personalEmail,
    companyEmail: employee.companyEmail,
    phone: employee.phone,
    role: employee.role,
    departmentId: employee.departmentId ?? '',
    positionId: employee.positionId ?? '',
    workStatus: employee.workStatus,
    emailStatus: employee.emailStatus,
    joinDate: employee.joinDate,
    baseSalary:
      sensitiveInfo?.baseSalary !== undefined
        ? String(sensitiveInfo.baseSalary)
        : '',
    bankId: sensitiveInfo?.bankId ?? '',
    bankAccountNumber: sensitiveInfo?.bankAccountNumber ?? '',
    bankAccountName: sensitiveInfo?.bankAccountName ?? '',
  };
}

function toEmployeePayload(form: EmployeeFormState): EmployeeUpsertPayload {
  return {
    code: form.code.trim(),
    name: form.name.trim(),
    personalEmail: form.personalEmail.trim(),
    companyEmail: form.companyEmail.trim(),
    phone: form.phone.trim(),
    role: form.role,
    departmentId: form.departmentId || null,
    positionId: form.positionId || null,
    workStatus: form.workStatus,
    emailStatus: form.emailStatus,
    joinDate: form.joinDate,
  };
}

function toSensitivePayload(
  form: EmployeeFormState,
): EmployeeSensitiveUpsertPayload {
  const nextBaseSalary = Number(form.baseSalary);

  return {
    ...(form.baseSalary.trim() !== '' && Number.isFinite(nextBaseSalary)
      ? { baseSalary: nextBaseSalary }
      : {}),
    ...(form.bankId.trim() ? { bankId: form.bankId.trim() } : {}),
    ...(form.bankAccountNumber.trim()
      ? { bankAccountNumber: form.bankAccountNumber.trim() }
      : {}),
    ...(form.bankAccountName.trim()
      ? { bankAccountName: form.bankAccountName.trim() }
      : {}),
  };
}

function hasSensitivePayloadValues(payload: EmployeeSensitiveUpsertPayload) {
  return Object.keys(payload).length > 0;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function getImportRowErrors(error: unknown): EmployeeImportRowError[] {
  if (!(error instanceof ApiError)) {
    return [];
  }

  const details = error.details;
  if (!details || typeof details !== 'object' || !('errors' in details)) {
    return [];
  }

  const { errors } = details as { errors?: unknown };
  if (!Array.isArray(errors)) {
    return [];
  }

  return errors.filter(
    (item): item is EmployeeImportRowError =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as EmployeeImportRowError).row === 'number' &&
      typeof (item as EmployeeImportRowError).field === 'string' &&
      typeof (item as EmployeeImportRowError).message === 'string',
  );
}

function getRoleScopeCopy(userRole: Role) {
  if (userRole === 'HR Admin') {
    return 'This live directory is still limited to Super Admin while backend role scopes are being expanded.';
  }

  if (userRole === 'Manager') {
    return 'Team-scoped employee records are planned, but the backend currently exposes this data to Super Admin only.';
  }

  return 'This screen is temporarily limited while employee self-service endpoints are still being added.';
}

function getDepartmentName(
  departments: Department[],
  departmentId: string | null,
) {
  return departments.find(department => department.id === departmentId)?.name;
}

function getPosition(positions: Position[], positionId: string | null) {
  return positions.find(position => position.id === positionId) ?? null;
}

export default function Employees({ userRole }: { userRole: Role }) {
  const isSuperAdmin = userRole === 'Super Admin';
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null,
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(
    null,
  );
  const [employeeForm, setEmployeeForm] = useState<EmployeeFormState>(
    createEmptyEmployeeForm(),
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSensitiveLoading, setIsSensitiveLoading] = useState(false);
  const [sensitiveError, setSensitiveError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importRowErrors, setImportRowErrors] = useState<EmployeeImportRowError[]>(
    [],
  );
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(
    null,
  );

  const {
    employees,
    isLoading: isEmployeesLoading,
    isFetching: isEmployeesFetching,
    error: employeesError,
    createEmployee,
    updateEmployee,
    getSensitiveInfo,
    updateSensitiveInfo,
    setSensitiveInfo,
    importEmployees,
    isCreating,
    isUpdating,
    isUpdatingSensitive,
    isImporting,
  } = useEmployees({
    enabled: isSuperAdmin,
    search: searchQuery.trim() || undefined,
    departmentId: filterDepartment || undefined,
    positionId: filterPosition || undefined,
  });
  const {
    departments,
    isLoading: isDepartmentsLoading,
    isFetching: isDepartmentsFetching,
    error: departmentsError,
  } = useDepartments({ enabled: isSuperAdmin });
  const {
    positions,
    isLoading: isPositionsLoading,
    isFetching: isPositionsFetching,
    error: positionsError,
  } = usePositions({ enabled: isSuperAdmin });

  const selectedEmployee =
    employees.find(employee => employee.id === selectedEmployeeId) ?? null;
  const selectedDepartment = selectedEmployee
    ? departments.find(
        department => department.id === selectedEmployee.departmentId,
      ) ?? null
    : null;
  const selectedPosition = selectedEmployee
    ? positions.find(position => position.id === selectedEmployee.positionId) ??
      null
    : null;
  const editingEmployee =
    employees.find(employee => employee.id === editingEmployeeId) ?? null;
  const positionOptions = positions.filter(
    position =>
      !filterDepartment || position.departmentId === filterDepartment,
  );
  const formPositionOptions = positions.filter(
    position =>
      !employeeForm.departmentId || position.departmentId === employeeForm.departmentId,
  );
  const pageError = employeesError || departmentsError || positionsError;
  const isPageLoading =
    isEmployeesLoading || isDepartmentsLoading || isPositionsLoading;
  const isPageSyncing =
    !isPageLoading &&
    (isEmployeesFetching || isDepartmentsFetching || isPositionsFetching);
  const isSavingEmployee =
    isSubmitting || isCreating || isUpdating || isUpdatingSensitive;

  useEffect(() => {
    if (
      selectedEmployeeId &&
      !isEmployeesLoading &&
      employees.length > 0 &&
      !selectedEmployee
    ) {
      setSelectedEmployeeId(null);
    }
  }, [employees, isEmployeesLoading, selectedEmployee, selectedEmployeeId]);

  useEffect(() => {
    if (!isSuperAdmin || !selectedEmployeeId || !selectedEmployee) {
      setSensitiveError(null);
      setIsSensitiveLoading(false);
      return;
    }

    if (selectedEmployee.sensitiveInfo) {
      setSensitiveError(null);
      setIsSensitiveLoading(false);
      return;
    }

    let isActive = true;

    const loadSensitiveData = async () => {
      try {
        setIsSensitiveLoading(true);
        setSensitiveError(null);
        const sensitiveInfo = await getSensitiveInfo(selectedEmployeeId);

        if (!isActive) {
          return;
        }

        setSensitiveInfo(selectedEmployeeId, sensitiveInfo);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setSensitiveError(
          getErrorMessage(error, 'Unable to load sensitive employee data.'),
        );
      } finally {
        if (isActive) {
          setIsSensitiveLoading(false);
        }
      }
    };

    loadSensitiveData();

    return () => {
      isActive = false;
    };
  }, [employees, isSuperAdmin, selectedEmployee, selectedEmployeeId]);

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setEmployeeForm(createEmptyEmployeeForm());
    setFormError(null);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingEmployeeId(null);
    setEmployeeForm(createEmptyEmployeeForm());
    setFormError(null);
  };

  const closeImportModal = () => {
    if (isImporting) {
      return;
    }

    setIsImportModalOpen(false);
    setImportError(null);
    setImportRowErrors([]);
  };

  const handleDepartmentFilterChange = (nextDepartmentId: string) => {
    setFilterDepartment(nextDepartmentId);
    setFilterPosition('');
  };

  const handleFormChange = <K extends keyof EmployeeFormState>(
    field: K,
    value: EmployeeFormState[K],
  ) => {
    setEmployeeForm(currentForm => {
      const nextForm = {
        ...currentForm,
        [field]: value,
      };

      if (field === 'departmentId') {
        const nextDepartmentId = String(value);
        const currentPositionStillValid = positions.some(
          position =>
            position.id === nextForm.positionId &&
            position.departmentId === nextDepartmentId,
        );

        if (!currentPositionStillValid) {
          nextForm.positionId = '';
        }
      }

      return nextForm;
    });
  };

  const openAddModal = () => {
    setFormError(null);
    setImportSuccessMessage(null);
    setEmployeeForm(createEmptyEmployeeForm());
    setIsAddModalOpen(true);
  };

  const openImportModal = () => {
    setImportError(null);
    setImportRowErrors([]);
    setImportSuccessMessage(null);
    setIsImportModalOpen(true);
  };

  const openEditModal = async (employee: Employee) => {
    setEditingEmployeeId(employee.id);
    setFormError(null);

    let nextSensitiveInfo = employee.sensitiveInfo ?? null;

    if (isSuperAdmin && !nextSensitiveInfo) {
      try {
        nextSensitiveInfo = await getSensitiveInfo(employee.id);
        setSensitiveInfo(employee.id, nextSensitiveInfo);
      } catch (error) {
        setFormError(
          getErrorMessage(
            error,
            'Unable to load sensitive data for this employee.',
          ),
        );
      }
    }

    setEmployeeForm(buildEmployeeForm(employee, nextSensitiveInfo));
    setIsEditModalOpen(true);
  };

  const handleCreateEmployee = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setFormError(null);

      const createdEmployee = await createEmployee(toEmployeePayload(employeeForm));
      const sensitivePayload = toSensitivePayload(employeeForm);

      if (hasSensitivePayloadValues(sensitivePayload)) {
        const nextSensitiveInfo = await updateSensitiveInfo(
          createdEmployee.id,
          sensitivePayload,
        );
        setSensitiveInfo(createdEmployee.id, nextSensitiveInfo);
      }

      closeAddModal();
    } catch (error) {
      setFormError(getErrorMessage(error, 'Unable to create employee.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateEmployee = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingEmployeeId) {
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const updatedEmployee = await updateEmployee(
        editingEmployeeId,
        toEmployeePayload(employeeForm),
      );
      const sensitivePayload = toSensitivePayload(employeeForm);

      if (hasSensitivePayloadValues(sensitivePayload)) {
        const nextSensitiveInfo = await updateSensitiveInfo(
          updatedEmployee.id,
          sensitivePayload,
        );
        setSensitiveInfo(updatedEmployee.id, nextSensitiveInfo);
      }

      closeEditModal();
    } catch (error) {
      setFormError(getErrorMessage(error, 'Unable to update employee.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportEmployees = async (file: File) => {
    try {
      setImportError(null);
      setImportRowErrors([]);

      const response = await importEmployees(file);
      setImportSuccessMessage(
        `Imported ${response.insertedCount} employees from ${response.fileName}.`,
      );
      setIsImportModalOpen(false);
    } catch (error) {
      setImportError(getErrorMessage(error, 'Unable to import employees.'));
      setImportRowErrors(getImportRowErrors(error));
      throw error;
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Employees</h2>
        </div>
        <div className="p-6 bg-slate-50/40">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm font-medium text-amber-900">
              Live employee data is limited in this sprint
            </p>
            <p className="mt-2 text-sm text-amber-800">
              {getRoleScopeCopy(userRole)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (selectedEmployee) {
    return (
      <EmployeeDetail
        employee={selectedEmployee}
        department={selectedDepartment}
        position={selectedPosition}
        userRole={userRole}
        sensitiveInfo={selectedEmployee.sensitiveInfo ?? null}
        isSensitiveLoading={isSensitiveLoading}
        sensitiveError={sensitiveError}
        onBack={() => setSelectedEmployeeId(null)}
        onEdit={openEditModal}
      />
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            Employee directory
          </h2>
          {isPageSyncing ? (
            <p className="mt-1 text-xs font-medium text-blue-600">
              Syncing latest employee data...
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openImportModal}
            className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-md text-sm font-medium hover:bg-slate-50 flex items-center transition-colors"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import employees
          </button>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add employee
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by employee name"
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <select
                value={filterDepartment}
                onChange={event =>
                  handleDepartmentFilterChange(event.target.value)
                }
                className="w-full sm:w-auto px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="">All departments</option>
                {departments.map(department => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
              <select
                value={filterPosition}
                onChange={event => setFilterPosition(event.target.value)}
                className="w-full sm:w-auto px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="">All positions</option>
                {positionOptions.map(position => (
                  <option key={position.id} value={position.id}>
                    {position.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {pageError ? (
            <div className="border-b border-rose-200 bg-rose-50 px-6 py-3 text-sm text-rose-700">
              {pageError}
            </div>
          ) : null}

          {importSuccessMessage ? (
            <div className="border-b border-emerald-200 bg-emerald-50 px-6 py-3 text-sm text-emerald-700">
              {importSuccessMessage}
            </div>
          ) : null}

          {isPageLoading ? (
            <div className="px-6 py-16 text-center text-sm text-slate-500">
              Loading employees...
            </div>
          ) : employees.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-slate-500">
              No employees matched the current filters.
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">
                    Role
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">
                    Department
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map(employee => {
                  const departmentName = getDepartmentName(
                    departments,
                    employee.departmentId,
                  );
                  const position = getPosition(positions, employee.positionId);

                  return (
                    <tr
                      key={employee.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-slate-200 flex-shrink-0 flex items-center justify-center text-slate-600 font-medium text-sm">
                            {employee.name.charAt(0)}
                          </div>
                          <div>
                            <span className="text-sm font-medium">
                              {employee.name}
                            </span>
                            <p className="text-xs text-slate-500 flex items-center mt-0.5">
                              <Mail className="w-3 h-3 mr-1" />
                              {employee.companyEmail}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                          {employee.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium">
                          {position?.title || 'Unassigned'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {departmentName || 'No department'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase ${
                            employee.workStatus === 'ACTIVE'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {employee.workStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={event => {
                              event.stopPropagation();
                              setSelectedEmployeeId(employee.id);
                            }}
                            className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-50"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={event => {
                              event.stopPropagation();
                              void openEditModal(employee);
                            }}
                            className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-50"
                            title="Edit employee"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        title="Add employee"
        maxWidth="max-w-3xl"
      >
        <form className="space-y-4" onSubmit={handleCreateEmployee}>
          {formError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {formError}
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Employee code
              </label>
              <input
                required
                type="text"
                value={employeeForm.code}
                onChange={event => handleFormChange('code', event.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Full name
              </label>
              <input
                required
                type="text"
                value={employeeForm.name}
                onChange={event => handleFormChange('name', event.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Company email
              </label>
              <input
                required
                type="email"
                value={employeeForm.companyEmail}
                onChange={event =>
                  handleFormChange('companyEmail', event.target.value)
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Personal email
              </label>
              <input
                required
                type="email"
                value={employeeForm.personalEmail}
                onChange={event =>
                  handleFormChange('personalEmail', event.target.value)
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Phone
              </label>
              <input
                required
                type="text"
                value={employeeForm.phone}
                onChange={event =>
                  handleFormChange('phone', event.target.value)
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Join date
              </label>
              <input
                required
                type="date"
                value={employeeForm.joinDate}
                onChange={event =>
                  handleFormChange('joinDate', event.target.value)
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Role
              </label>
              <select
                value={employeeForm.role}
                onChange={event =>
                  handleFormChange('role', event.target.value as Role)
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              >
                <option value="Employee">Employee</option>
                <option value="Manager">Manager</option>
                <option value="HR Admin">HR Admin</option>
                <option value="Super Admin">Super Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Work status
              </label>
              <select
                value={employeeForm.workStatus}
                onChange={event =>
                  handleFormChange(
                    'workStatus',
                    event.target.value as EmployeeWorkStatus,
                  )
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              >
                {workStatusOptions.map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Department
              </label>
              <select
                value={employeeForm.departmentId}
                onChange={event =>
                  handleFormChange('departmentId', event.target.value)
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              >
                <option value="">No department</option>
                {departments.map(department => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Position
              </label>
              <select
                value={employeeForm.positionId}
                onChange={event =>
                  handleFormChange('positionId', event.target.value)
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              >
                <option value="">No position</option>
                {formPositionOptions.map(position => (
                  <option key={position.id} value={position.id}>
                    {position.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email status
              </label>
              <select
                value={employeeForm.emailStatus}
                onChange={event =>
                  handleFormChange(
                    'emailStatus',
                    event.target.value as CompanyEmailStatus,
                  )
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              >
                {emailStatusOptions.map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">
              Sensitive information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Base salary
                </label>
                <input
                  type="number"
                  min="0"
                  value={employeeForm.baseSalary}
                  onChange={event =>
                    handleFormChange('baseSalary', event.target.value)
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Bank
                </label>
                <input
                  type="text"
                  value={employeeForm.bankId}
                  onChange={event =>
                    handleFormChange('bankId', event.target.value)
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Bank account number
                </label>
                <input
                  type="text"
                  value={employeeForm.bankAccountNumber}
                  onChange={event =>
                    handleFormChange('bankAccountNumber', event.target.value)
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Account holder
                </label>
                <input
                  type="text"
                  value={employeeForm.bankAccountName}
                  onChange={event =>
                    handleFormChange('bankAccountName', event.target.value)
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={closeAddModal}
              disabled={isSavingEmployee}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingEmployee}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-60"
            >
              {isSavingEmployee ? 'Saving...' : 'Create employee'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        title="Edit employee"
        maxWidth="max-w-3xl"
      >
        {editingEmployee ? (
          <form className="space-y-4" onSubmit={handleUpdateEmployee}>
            {formError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {formError}
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Employee code
                </label>
                <input
                  required
                  type="text"
                  value={employeeForm.code}
                  onChange={event => handleFormChange('code', event.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Full name
                </label>
                <input
                  required
                  type="text"
                  value={employeeForm.name}
                  onChange={event => handleFormChange('name', event.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Company email
                </label>
                <input
                  required
                  type="email"
                  value={employeeForm.companyEmail}
                  onChange={event =>
                    handleFormChange('companyEmail', event.target.value)
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Personal email
                </label>
                <input
                  required
                  type="email"
                  value={employeeForm.personalEmail}
                  onChange={event =>
                    handleFormChange('personalEmail', event.target.value)
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Phone
                </label>
                <input
                  required
                  type="text"
                  value={employeeForm.phone}
                  onChange={event =>
                    handleFormChange('phone', event.target.value)
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Join date
                </label>
                <input
                  required
                  type="date"
                  value={employeeForm.joinDate}
                  onChange={event =>
                    handleFormChange('joinDate', event.target.value)
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Role
                </label>
                <select
                  value={employeeForm.role}
                  onChange={event =>
                    handleFormChange('role', event.target.value as Role)
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                >
                  <option value="Employee">Employee</option>
                  <option value="Manager">Manager</option>
                  <option value="HR Admin">HR Admin</option>
                  <option value="Super Admin">Super Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Work status
                </label>
                <select
                  value={employeeForm.workStatus}
                  onChange={event =>
                    handleFormChange(
                      'workStatus',
                      event.target.value as EmployeeWorkStatus,
                    )
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                >
                  {workStatusOptions.map(status => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Department
                </label>
                <select
                  value={employeeForm.departmentId}
                  onChange={event =>
                    handleFormChange('departmentId', event.target.value)
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                >
                  <option value="">No department</option>
                  {departments.map(department => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Position
                </label>
                <select
                  value={employeeForm.positionId}
                  onChange={event =>
                    handleFormChange('positionId', event.target.value)
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                >
                  <option value="">No position</option>
                  {formPositionOptions.map(position => (
                    <option key={position.id} value={position.id}>
                      {position.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email status
                </label>
                <select
                  value={employeeForm.emailStatus}
                  onChange={event =>
                    handleFormChange(
                      'emailStatus',
                      event.target.value as CompanyEmailStatus,
                    )
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                >
                  {emailStatusOptions.map(status => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">
                Sensitive information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Base salary
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={employeeForm.baseSalary}
                    onChange={event =>
                      handleFormChange('baseSalary', event.target.value)
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Bank
                  </label>
                  <input
                    type="text"
                    value={employeeForm.bankId}
                    onChange={event =>
                      handleFormChange('bankId', event.target.value)
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Bank account number
                  </label>
                  <input
                    type="text"
                    value={employeeForm.bankAccountNumber}
                    onChange={event =>
                      handleFormChange('bankAccountNumber', event.target.value)
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Account holder
                  </label>
                  <input
                    type="text"
                    value={employeeForm.bankAccountName}
                    onChange={event =>
                      handleFormChange('bankAccountName', event.target.value)
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeEditModal}
                disabled={isSavingEmployee}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingEmployee}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-60"
              >
                {isSavingEmployee ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        ) : null}
      </Modal>

      <EmployeeImportModal
        isOpen={isImportModalOpen}
        onClose={closeImportModal}
        onImport={handleImportEmployees}
        isImporting={isImporting}
        errorMessage={importError}
        rowErrors={importRowErrors}
      />
    </div>
  );
}
