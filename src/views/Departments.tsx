import { FormEvent, useState } from 'react';
import { Edit2, Plus, Users } from 'lucide-react';

import Modal from '../components/Modal';
import { useDepartments } from '../hooks/useDepartments';
import { useEmployees } from '../hooks/useEmployees';
import { usePositions } from '../hooks/usePositions';
import {
  DepartmentUpsertPayload,
  PositionUpsertPayload,
} from '../services/employee.service';
import { Department, Role } from '../types';

type DepartmentFormState = {
  name: string;
  code: string;
  managerId: string;
};

type PositionFormState = {
  title: string;
  baseSalary: string;
  departmentId: string;
};

function createEmptyDepartmentForm(): DepartmentFormState {
  return {
    name: '',
    code: '',
    managerId: '',
  };
}

function createDepartmentForm(department: Department): DepartmentFormState {
  return {
    name: department.name,
    code: department.code ?? '',
    managerId: department.managerId ?? '',
  };
}

function createEmptyPositionForm(departmentId = ''): PositionFormState {
  return {
    title: '',
    baseSalary: '',
    departmentId,
  };
}

function toDepartmentPayload(
  form: DepartmentFormState,
): DepartmentUpsertPayload {
  return {
    name: form.name.trim(),
    ...(form.code.trim() ? { code: form.code.trim() } : {}),
    managerId: form.managerId || null,
  };
}

function toPositionPayload(form: PositionFormState): PositionUpsertPayload {
  return {
    title: form.title.trim(),
    departmentId: form.departmentId,
    baseSalary: Number(form.baseSalary),
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function getRoleScopeCopy(userRole: Role) {
  if (userRole === 'HR Admin') {
    return 'Live department and position management is still limited to Super Admin while backend role scopes are being expanded.';
  }

  if (userRole === 'Manager') {
    return 'Department data is planned to become team-scoped, but the backend currently exposes this area to Super Admin only.';
  }

  return 'This screen is temporarily limited while role-scoped department endpoints are still being added.';
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);
}

export default function Departments({ userRole }: { userRole: Role }) {
  const isSuperAdmin = userRole === 'Super Admin';
  const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false);
  const [isEditDeptModalOpen, setIsEditDeptModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [isAddPosModalOpen, setIsAddPosModalOpen] = useState(false);
  const [deptForm, setDeptForm] = useState<DepartmentFormState>(
    createEmptyDepartmentForm(),
  );
  const [positionForm, setPositionForm] = useState<PositionFormState>(
    createEmptyPositionForm(),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [positionFormError, setPositionFormError] = useState<string | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingPosition, setIsSubmittingPosition] = useState(false);

  const {
    departments,
    isLoading: isDepartmentsLoading,
    isFetching: isDepartmentsFetching,
    error: departmentsError,
    createDepartment,
    updateDepartment,
    isCreating: isCreatingDepartment,
    isUpdating: isUpdatingDepartment,
  } = useDepartments({ enabled: isSuperAdmin });
  const {
    positions,
    isLoading: isPositionsLoading,
    isFetching: isPositionsFetching,
    error: positionsError,
    createPosition,
    isCreating: isCreatingPosition,
  } = usePositions({ enabled: isSuperAdmin });
  const {
    employees,
    isLoading: isEmployeesLoading,
    isFetching: isEmployeesFetching,
    error: employeesError,
  } = useEmployees({ enabled: isSuperAdmin });

  const managerOptions = employees.filter(
    employee =>
      employee.role === 'Manager' || employee.role === 'Super Admin',
  );
  const pageError = departmentsError || positionsError || employeesError;
  const isPageLoading =
    isDepartmentsLoading || isPositionsLoading || isEmployeesLoading;
  const isPageSyncing =
    !isPageLoading &&
    (isDepartmentsFetching || isPositionsFetching || isEmployeesFetching);
  const isSavingDepartment =
    isSubmitting || isCreatingDepartment || isUpdatingDepartment;
  const isSavingPosition = isSubmittingPosition || isCreatingPosition;

  const closeAddDepartmentModal = () => {
    setIsAddDeptModalOpen(false);
    setDeptForm(createEmptyDepartmentForm());
    setFormError(null);
  };

  const closeEditDepartmentModal = () => {
    setIsEditDeptModalOpen(false);
    setSelectedDept(null);
    setDeptForm(createEmptyDepartmentForm());
    setFormError(null);
  };

  const closeAddPositionModal = () => {
    setIsAddPosModalOpen(false);
    setPositionForm(createEmptyPositionForm());
    setPositionFormError(null);
  };

  const openAddDepartmentModal = () => {
    setDeptForm(createEmptyDepartmentForm());
    setFormError(null);
    setIsAddDeptModalOpen(true);
  };

  const openEditDepartmentModal = (department: Department) => {
    setSelectedDept(department);
    setDeptForm(createDepartmentForm(department));
    setFormError(null);
    setIsEditDeptModalOpen(true);
  };

  const openAddPositionModal = (departmentId: string) => {
    setPositionForm(createEmptyPositionForm(departmentId));
    setPositionFormError(null);
    setIsAddPosModalOpen(true);
  };

  const handleCreateDepartment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setFormError(null);
      await createDepartment(toDepartmentPayload(deptForm));
      closeAddDepartmentModal();
    } catch (error) {
      setFormError(getErrorMessage(error, 'Unable to create department.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDepartment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedDept) {
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      await updateDepartment(selectedDept.id, toDepartmentPayload(deptForm));
      closeEditDepartmentModal();
    } catch (error) {
      setFormError(getErrorMessage(error, 'Unable to update department.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreatePosition = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsSubmittingPosition(true);
      setPositionFormError(null);
      await createPosition(toPositionPayload(positionForm));
      closeAddPositionModal();
    } catch (error) {
      setPositionFormError(getErrorMessage(error, 'Unable to create position.'));
    } finally {
      setIsSubmittingPosition(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">
            Departments and positions
          </h2>
        </div>
        <div className="p-6 bg-slate-50/40">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm font-medium text-amber-900">
              Live department data is limited in this sprint
            </p>
            <p className="mt-2 text-sm text-amber-800">
              {getRoleScopeCopy(userRole)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            Departments and positions
          </h2>
          {isPageSyncing ? (
            <p className="mt-1 text-xs font-medium text-blue-600">
              Syncing latest department data...
            </p>
          ) : null}
        </div>
        <button
          onClick={openAddDepartmentModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create department
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
        {pageError ? (
          <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {pageError}
          </div>
        ) : null}

        {isPageLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500">
            Loading departments...
          </div>
        ) : departments.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500">
            No departments found yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {departments.map(department => {
              const departmentEmployees = employees.filter(
                employee => employee.departmentId === department.id,
              );
              const departmentPositions = positions.filter(
                position => position.departmentId === department.id,
              );
              const managerName =
                employees.find(employee => employee.id === department.managerId)
                  ?.name ?? 'Not assigned';

              return (
                <div
                  key={department.id}
                  className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">
                        {department.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Code: {department.code || 'N/A'}
                      </p>
                    </div>
                    <button
                      onClick={() => openEditDepartmentModal(department)}
                      className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-50"
                      title="Edit department"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                        Team size
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-900 flex items-center">
                        <Users className="w-4 h-4 mr-2 text-slate-400" />
                        {departmentEmployees.length}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                        Manager
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {managerName}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Positions
                      </h4>
                      <button
                        onClick={() => openAddPositionModal(department.id)}
                        className="text-blue-600 hover:text-blue-800 transition-colors text-xs font-medium flex items-center"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add position
                      </button>
                    </div>

                    {departmentPositions.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">
                        No positions in this department yet.
                      </div>
                    ) : (
                      departmentPositions.map(position => {
                        const assigneeCount = employees.filter(
                          employee => employee.positionId === position.id,
                        ).length;

                        return (
                          <div
                            key={position.id}
                            className="rounded-lg border border-slate-200 px-3 py-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-slate-800">
                                  {position.title}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  Base salary: {formatCurrency(position.baseSalary)}
                                </p>
                              </div>
                              <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                                {assigneeCount} assigned
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={isAddDeptModalOpen}
        onClose={closeAddDepartmentModal}
        title="Create department"
      >
        <form className="space-y-4" onSubmit={handleCreateDepartment}>
          {formError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {formError}
            </div>
          ) : null}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Department name
            </label>
            <input
              required
              type="text"
              value={deptForm.name}
              onChange={event =>
                setDeptForm(currentForm => ({
                  ...currentForm,
                  name: event.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Department code
            </label>
            <input
              type="text"
              value={deptForm.code}
              onChange={event =>
                setDeptForm(currentForm => ({
                  ...currentForm,
                  code: event.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Manager
            </label>
            <select
              value={deptForm.managerId}
              onChange={event =>
                setDeptForm(currentForm => ({
                  ...currentForm,
                  managerId: event.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            >
              <option value="">No manager assigned</option>
              {managerOptions.map(manager => (
                <option key={manager.id} value={manager.id}>
                  {manager.name}
                </option>
              ))}
            </select>
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={closeAddDepartmentModal}
              disabled={isSavingDepartment}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingDepartment}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-60"
            >
              {isSavingDepartment ? 'Saving...' : 'Create department'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isEditDeptModalOpen}
        onClose={closeEditDepartmentModal}
        title="Edit department"
      >
        {selectedDept ? (
          <form className="space-y-4" onSubmit={handleUpdateDepartment}>
            {formError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {formError}
              </div>
            ) : null}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Department name
              </label>
              <input
                required
                type="text"
                value={deptForm.name}
                onChange={event =>
                  setDeptForm(currentForm => ({
                    ...currentForm,
                    name: event.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Department code
              </label>
              <input
                type="text"
                value={deptForm.code}
                onChange={event =>
                  setDeptForm(currentForm => ({
                    ...currentForm,
                    code: event.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Manager
              </label>
              <select
                value={deptForm.managerId}
                onChange={event =>
                  setDeptForm(currentForm => ({
                    ...currentForm,
                    managerId: event.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              >
                <option value="">No manager assigned</option>
                {managerOptions.map(manager => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="pt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeEditDepartmentModal}
                disabled={isSavingDepartment}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingDepartment}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-60"
              >
                {isSavingDepartment ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal
        isOpen={isAddPosModalOpen}
        onClose={closeAddPositionModal}
        title="Add position"
      >
        <form className="space-y-4" onSubmit={handleCreatePosition}>
          {positionFormError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {positionFormError}
            </div>
          ) : null}

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <span className="font-medium">Department: </span>
            {departments.find(department => department.id === positionForm.departmentId)
              ?.name || 'Unknown'}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Position title
            </label>
            <input
              required
              type="text"
              value={positionForm.title}
              onChange={event =>
                setPositionForm(currentForm => ({
                  ...currentForm,
                  title: event.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Base salary
            </label>
            <input
              required
              type="number"
              min="0"
              value={positionForm.baseSalary}
              onChange={event =>
                setPositionForm(currentForm => ({
                  ...currentForm,
                  baseSalary: event.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={closeAddPositionModal}
              disabled={isSavingPosition}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingPosition}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-60"
            >
              {isSavingPosition ? 'Saving...' : 'Create position'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
