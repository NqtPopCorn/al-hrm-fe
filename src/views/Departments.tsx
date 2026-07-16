import { FormEvent, useState, useMemo } from 'react';
import { 
  Edit2, Plus, Users, Search, ChevronDown, ChevronRight, 
  Building2, Briefcase, Ban
} from 'lucide-react';
import { useToast } from '../components/Toast';

import Modal from '../components/Modal';
import { useDepartments } from '../hooks/useDepartments';
import { useEmployees } from '../hooks/useEmployees';
import { usePositions } from '../hooks/usePositions';
import {
  DepartmentUpsertPayload,
  PositionUpsertPayload,
} from '../services/employee.service';
import { Department, Position, Role } from '../types';

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

function createPositionForm(position: Position): PositionFormState {
  return {
    title: position.title,
    baseSalary: String(position.baseSalary),
    departmentId: position.departmentId,
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
    return 'Quản lý phòng ban và vị trí hiện chỉ giới hạn cho Super Admin trong khi phân quyền backend đang được mở rộng.';
  }

  if (userRole === 'Manager') {
    return 'Dữ liệu phòng ban dự kiến sẽ được phân quyền theo nhóm, nhưng hiện tại backend chỉ cho phép Super Admin truy cập khu vực này.';
  }

  return 'Màn hình này tạm thời bị giới hạn trong khi các endpoint phân quyền phòng ban đang được bổ sung.';
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);
}

export default function Departments({ userRole }: { userRole: Role }) {
  const { showToast } = useToast();
  const isSuperAdmin = userRole === 'Super Admin';
  const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false);
  const [isEditDeptModalOpen, setIsEditDeptModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [isAddPosModalOpen, setIsAddPosModalOpen] = useState(false);
  const [isEditPosModalOpen, setIsEditPosModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
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
  const [departmentPendingDisable, setDepartmentPendingDisable] =
    useState<Department | null>(null);
  const [disableDepartmentError, setDisableDepartmentError] =
    useState<string | null>(null);

  // --- UX/UI State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());

  const {
    departments,
    isLoading: isDepartmentsLoading,
    isFetching: isDepartmentsFetching,
    error: departmentsError,
    createDepartment,
    updateDepartment,
    disableDepartment,
    isCreating: isCreatingDepartment,
    isUpdating: isUpdatingDepartment,
    isDisabling: isDisablingDepartment,
  } = useDepartments({ enabled: isSuperAdmin });
  const {
    positions,
    isLoading: isPositionsLoading,
    isFetching: isPositionsFetching,
    error: positionsError,
    createPosition,
    updatePosition,
    isCreating: isCreatingPosition,
    isUpdating: isUpdatingPosition,
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
  const isSavingPosition =
    isSubmittingPosition || isCreatingPosition || isUpdatingPosition;

  // --- Derived Data (Search & Filter) ---
  const filteredDepartments = useMemo(() => {
    if (!searchQuery.trim()) return departments;
    const query = searchQuery.toLowerCase();
    return departments.filter(d => 
      d.name.toLowerCase().includes(query) || 
      (d.code && d.code.toLowerCase().includes(query))
    );
  }, [departments, searchQuery]);

  // --- Handlers (Toggle Accordion) ---
  const toggleDeptExpansion = (deptId: string) => {
    setExpandedDepts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(deptId)) newSet.delete(deptId);
      else newSet.add(deptId);
      return newSet;
    });
  };

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

  const closeEditPositionModal = () => {
    setIsEditPosModalOpen(false);
    setSelectedPosition(null);
    setPositionForm(createEmptyPositionForm());
    setPositionFormError(null);
  };

  const closeDisableDepartmentModal = () => {
    if (isDisablingDepartment) {
      return;
    }

    setDisableDepartmentError(null);
    setDepartmentPendingDisable(null);
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

  const openEditPositionModal = (position: Position) => {
    setSelectedPosition(position);
    setPositionForm(createPositionForm(position));
    setPositionFormError(null);
    setIsEditPosModalOpen(true);
  };

  const openDisableDepartmentModal = (department: Department) => {
    setDisableDepartmentError(null);
    setDepartmentPendingDisable(department);
  };

  const handleCreateDepartment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setFormError(null);
      await createDepartment(toDepartmentPayload(deptForm));
      closeAddDepartmentModal();
      showToast({ type: 'success', message: `Đã tạo phòng ban “${deptForm.name}” thành công.` });
    } catch (error) {
      setFormError(getErrorMessage(error, 'Không thể tạo phòng ban.'));
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
      showToast({ type: 'success', message: `Đã cập nhật phòng ban “${deptForm.name}” thành công.` });
    } catch (error) {
      setFormError(getErrorMessage(error, 'Không thể cập nhật phòng ban.'));
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
      showToast({ type: 'success', message: `Đã tạo vị trí “${positionForm.title}” thành công.` });
    } catch (error) {
      setPositionFormError(getErrorMessage(error, 'Không thể tạo vị trí.'));
    } finally {
      setIsSubmittingPosition(false);
    }
  };

  const handleUpdatePosition = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedPosition) {
      return;
    }

    try {
      setIsSubmittingPosition(true);
      setPositionFormError(null);
      await updatePosition(selectedPosition.id, toPositionPayload(positionForm));
      closeEditPositionModal();
      showToast({ type: 'success', message: `Đã cập nhật vị trí “${positionForm.title}” thành công.` });
    } catch (error) {
      setPositionFormError(getErrorMessage(error, 'Không thể cập nhật vị trí.'));
    } finally {
      setIsSubmittingPosition(false);
    }
  };

  const handleDisableDepartment = async () => {
    if (!departmentPendingDisable) {
      return;
    }

    const deptName = departmentPendingDisable.name;
    try {
      setDisableDepartmentError(null);
      await disableDepartment(departmentPendingDisable.id);
      setDepartmentPendingDisable(null);
      showToast({ type: 'success', message: `Đã vô hiệu hóa phòng ban “${deptName}”.` });
    } catch (error) {
      const msg = getErrorMessage(error, 'Không thể vô hiệu hóa phòng ban.');
      setDisableDepartmentError(msg);
      showToast({ type: 'error', message: msg });
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Phòng ban và Vị trí</h2>
        </div>
        <div className="p-6 bg-slate-50/40">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm font-medium text-amber-900">Dữ liệu phòng ban bị giới hạn trong giai đoạn này</p>
            <p className="mt-2 text-sm text-amber-800">{getRoleScopeCopy(userRole)}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-6rem)]">
      {/* Header Area */}
      <div className="px-6 py-5 bg-white border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-600" />
              Phòng ban & Vị trí
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Quản lý cơ cấu công ty, trưởng phòng và các vị trí công việc cụ thể.
            </p>
            {isPageSyncing && <p className="text-xs font-medium text-blue-600 mt-1 animate-pulse">Đang đồng bộ dữ liệu...</p>}
          </div>
          <button
            onClick={openAddDepartmentModal}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center transition-all shadow-sm hover:shadow active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm phòng ban
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="mt-6 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm phòng ban theo tên hoặc mã..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div className="text-sm text-slate-500 font-medium">
            Tổng cộng: {filteredDepartments.length} Phòng ban
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-6">
        {pageError && (
          <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-center">
            <Ban className="w-4 h-4 mr-2" />
            {pageError}
          </div>
        )}

        {isPageLoading ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-500 flex flex-col items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            Đang tải cơ cấu tổ chức...
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-500">
            {searchQuery ? 'Không có phòng ban nào khớp với tìm kiếm của bạn.' : 'Chưa có phòng ban nào. Hãy tạo mới để bắt đầu.'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDepartments.map(department => {
              const departmentEmployees = employees.filter(emp => emp.departmentId === department.id);
              const departmentPositions = positions.filter(pos => pos.departmentId === department.id);
              const managerName = employees.find(emp => emp.id === department.managerId)?.name ?? 'Chưa phân bổ';
              const isExpanded = expandedDepts.has(department.id);
              const isInactive = department.isActive === false;

              return (
                <div key={department.id} className={`bg-white border rounded-xl shadow-sm overflow-hidden transition-colors ${isInactive ? 'border-slate-200 bg-slate-50/50' : 'border-slate-200 hover:border-blue-300'}`}>
                  {/* Department Row (Clickable) */}
                  <div 
                    className="flex flex-col lg:flex-row lg:items-center justify-between p-4 cursor-pointer"
                    onClick={() => toggleDeptExpansion(department.id)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-2 rounded-lg ${isInactive ? 'bg-slate-200 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className={`text-base font-semibold ${isInactive ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-900'}`}>
                            {department.name}
                          </h3>
                          {isInactive && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 text-slate-600">Ngừng hoạt động</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>Mã: <span className="font-medium text-slate-700">{department.code || 'N/A'}</span></span>
                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          <span>Quản lý: <span className="font-medium text-slate-700">{managerName}</span></span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 mt-4 lg:mt-0 pl-14 lg:pl-0">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                          <Users className="w-4 h-4" />
                          <span className="font-medium">{departmentEmployees.length}</span> nhân viên
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                          <Briefcase className="w-4 h-4" />
                          <span className="font-medium">{departmentPositions.length}</span> vị trí
                        </div>
                      </div>

                      {/* Department Actions */}
                      <div className="flex items-center gap-2 border-l border-slate-200 pl-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openEditDepartmentModal(department)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Chỉnh sửa phòng ban"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {!isInactive && (
                          <button
                            onClick={() => openDisableDepartmentModal(department)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Vô hiệu hóa phòng ban"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Positions Area */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-4 pl-14">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          Vị trí công việc tại {department.name}
                        </h4>
                        <button
                          onClick={() => openAddPositionModal(department.id)}
                          disabled={isInactive}
                          className="text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium flex items-center disabled:opacity-50 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Thêm vị trí
                        </button>
                      </div>

                      {departmentPositions.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
                          Chưa có vị trí nào được thiết lập cho phòng ban này.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                          {departmentPositions.map(position => {
                            const assigneeCount = employees.filter(emp => emp.positionId === position.id).length;
                            return (
                              <div key={position.id} className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium text-slate-800 truncate" title={position.title}>{position.title}</p>
                                    <p className="text-xs text-slate-500 mt-1">Lương: <span className="font-medium text-slate-700">{formatCurrency(position.baseSalary)}</span></p>
                                  </div>
                                  <button
                                    onClick={() => openEditPositionModal(position)}
                                    className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition-colors"
                                    title="Chỉnh sửa vị trí"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${assigneeCount === 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                    {assigneeCount} Đã phân bổ
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={isAddDeptModalOpen}
        onClose={closeAddDepartmentModal}
        title="Tạo phòng ban"
      >
        <form className="space-y-4" onSubmit={handleCreateDepartment}>
          {formError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {formError}
            </div>
          ) : null}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Tên phòng ban
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
              Mã phòng ban
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
              Người quản lý
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
              <option value="">Chưa có người quản lý</option>
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
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSavingDepartment}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-60"
            >
              {isSavingDepartment ? 'Đang lưu...' : 'Tạo phòng ban'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isEditDeptModalOpen}
        onClose={closeEditDepartmentModal}
        title="Chỉnh sửa phòng ban"
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
                Tên phòng ban
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
                Mã phòng ban
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
                Người quản lý
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
                <option value="">Chưa có người quản lý</option>
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
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSavingDepartment}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-60"
              >
                {isSavingDepartment ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal
        isOpen={isAddPosModalOpen}
        onClose={closeAddPositionModal}
        title="Thêm vị trí"
      >
        <form className="space-y-4" onSubmit={handleCreatePosition}>
          {positionFormError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {positionFormError}
            </div>
          ) : null}

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <span className="font-medium">Phòng ban: </span>
            {departments.find(department => department.id === positionForm.departmentId)
              ?.name || 'Không xác định'}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Tên vị trí
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
              Mức lương cơ bản
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
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSavingPosition}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-60"
            >
              {isSavingPosition ? 'Đang lưu...' : 'Tạo vị trí'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isEditPosModalOpen}
        onClose={closeEditPositionModal}
        title="Chỉnh sửa vị trí"
      >
        {selectedPosition ? (
          <form className="space-y-4" onSubmit={handleUpdatePosition}>
            {positionFormError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {positionFormError}
              </div>
            ) : null}

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <span className="font-medium">Phòng ban: </span>
              {departments.find(
                department => department.id === selectedPosition.departmentId,
              )?.name || 'Không xác định'}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tên vị trí
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
                Mức lương cơ bản
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
                onClick={closeEditPositionModal}
                disabled={isSavingPosition}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSavingPosition}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-60"
              >
                {isSavingPosition ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal
        isOpen={!!departmentPendingDisable}
        onClose={closeDisableDepartmentModal}
        title="Vô hiệu hóa phòng ban"
      >
        {departmentPendingDisable ? (
          <div className="space-y-4">
            {disableDepartmentError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {disableDepartmentError}
              </div>
            ) : null}

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <p>
                Đây là thao tác xóa mềm.{' '}
                <span className="font-medium">{departmentPendingDisable.name}</span>{' '}
                sẽ vẫn hiển thị nhưng chuyển sang trạng thái ngừng hoạt động.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeDisableDepartmentModal}
                disabled={isDisablingDepartment}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleDisableDepartment()}
                disabled={isDisablingDepartment}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors disabled:opacity-60"
              >
                {isDisablingDepartment ? 'Đang vô hiệu hóa...' : 'Vô hiệu hóa phòng ban'}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
