import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Edit3, Eye, FileText, LayoutDashboard, MapPin } from 'lucide-react';
import { useToast } from '../components/Toast';

import Modal from '../components/Modal';
import { useAttendance } from '../hooks/useAttendance';
import { useDepartments } from '../hooks/useDepartments';
import { useEmployees } from '../hooks/useEmployees';
import {
  getAttendanceStatusMeta,
  getCheckInStatus,
  getCheckOutStatus,
} from '../lib/attendance-status';
import {
  filterAndPaginateAdjustmentRequests,
  filterAndPaginateAttendanceRecords,
  filterAndPaginateReports,
  getEmployeeOptions,
  getEmployeeSummary,
} from './attendance-view-model';
import {
  AttendanceAdjustmentRequest,
  AttendanceRecord,
  DailyReport,
  User,
  WorkMode,
} from '../types';
import AdminAttendanceDashboard from './AdminAttendanceDashboard';
import { useDailyReports } from '../hooks/useDailyReports';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function buildIsoDateTime(workDate: string, timeValue: string) {
  return new Date(`${workDate}T${timeValue}:00`).toISOString();
}

function getStatusBadgeClasses(status: AttendanceRecord['status']) {
  if (status === 'VALID') {
    return 'bg-green-100 text-green-700';
  }

  if (status === 'LATE' || status === 'EARLY_LEAVE') {
    return 'bg-amber-100 text-amber-700';
  }

  return 'bg-rose-100 text-rose-700';
}

function getAdjustmentStatusClasses(status: AttendanceAdjustmentRequest['status']) {
  if (status === 'APPROVED') {
    return 'bg-green-100 text-green-700';
  }

  if (status === 'PENDING') {
    return 'bg-amber-100 text-amber-700';
  }

  return 'bg-rose-100 text-rose-700';
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export default function Attendance({ user }: { user: User }) {
  const { showToast } = useToast();
  const currentMonth = getCurrentMonth();
  const isSuperAdmin = user.role === 'Super Admin';
  const [viewMode, setViewMode] = useState<'dashboard' | 'company' | 'requests' | 'reports'>('dashboard');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [selectedRequest, setSelectedRequest] =
    useState<AttendanceAdjustmentRequest | null>(null);
  const [viewingReport, setViewingReport] = useState<DailyReport | null>(null);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustCheckIn, setAdjustCheckIn] = useState('');
  const [adjustCheckOut, setAdjustCheckOut] = useState('');
  const [adjustWorkMode, setAdjustWorkMode] = useState<WorkMode>('OFFICE');
  const [reviewNote, setReviewNote] = useState('');
  const [pageActionError, setPageActionError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const {
    reports,
    isLoading: isReportsLoading,
    error: reportsError,
  } = useDailyReports({
    scope: 'all',
    enabled: isSuperAdmin,
  });

  const {
    employees,
    isLoading: isEmployeesLoading,
    error: employeesError,
  } = useEmployees({
    enabled: isSuperAdmin,
    page: 1,
    limit: 1000,
  });
  const {
    departments,
    isLoading: isDepartmentsLoading,
    error: departmentsError,
  } = useDepartments({
    enabled: isSuperAdmin,
  });

  const employeeOptions = getEmployeeOptions(employees, {
    departmentId: selectedDepartmentId,
  });
  const employeeIds =
    selectedEmployeeId.length > 0
      ? [selectedEmployeeId]
      : employeeOptions.map(employee => employee.id);

  const {
    records,
    adjustmentRequests,
    isLoading: isAttendanceLoading,
    isAdjustmentRequestsLoading,
    error: attendanceError,
    adjustmentRequestsError,
    manualAdjust,
    approveAdjustmentRequest,
    isAdjusting,
    isApprovingAdjustmentRequest,
  } = useAttendance({
    month: selectedMonth,
    employeeIds,
    enabled: isSuperAdmin && employeeIds.length > 0,
    includeAdjustmentRequests: isSuperAdmin,
    adjustmentFilters:
      selectedEmployeeId.length > 0
        ? { employeeId: selectedEmployeeId }
        : undefined,
  });
  const pageError =
    employeesError ||
    departmentsError ||
    attendanceError ||
    adjustmentRequestsError;
  const isLoading =
    isEmployeesLoading ||
    isDepartmentsLoading ||
    isAttendanceLoading ||
    isAdjustmentRequestsLoading;
  const sharedFilters = {
    month: selectedMonth,
    departmentId: selectedDepartmentId,
    employeeId: selectedEmployeeId,
  };
  const paginatedRecords = filterAndPaginateAttendanceRecords({
    records,
    employees,
    departments,
    filters: sharedFilters,
    page,
    pageSize,
  });
  const paginatedRequests = filterAndPaginateAdjustmentRequests({
    requests: adjustmentRequests,
    employees,
    departments,
    filters: sharedFilters,
    page,
    pageSize,
  });
  const activePagination =
    viewMode === 'company'
      ? paginatedRecords
      : paginatedRequests;
  const paginatedReports = filterAndPaginateReports({
    reports,
    employees,
    departments,
    filters: sharedFilters,
    page,
    pageSize,
  });

  useEffect(() => {
    setPage(1);
  }, [viewMode, selectedMonth, selectedDepartmentId, selectedEmployeeId, pageSize]);

  useEffect(() => {
    if (
      selectedEmployeeId.length > 0 &&
      !employeeOptions.some(employee => employee.id === selectedEmployeeId)
    ) {
      setSelectedEmployeeId('');
    }
  }, [employeeOptions, selectedEmployeeId]);

  const openAdjustModal = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setAdjustCheckIn(record.checkIn ?? '');
    setAdjustCheckOut(record.checkOut ?? '');
    setAdjustWorkMode(record.type);
    setAdjustReason(record.manualAdjustmentReason ?? '');
    setPageActionError(null);
    setIsAdjustModalOpen(true);
  };

  const openApproveModal = (request: AttendanceAdjustmentRequest) => {
    setSelectedRequest(request);
    setReviewNote(request.reviewNote ?? '');
    setPageActionError(null);
    setIsApproveModalOpen(true);
  };

  const handleManualAdjust = async () => {
    if (!selectedRecord) {
      return;
    }

    if (!adjustReason.trim()) {
      setPageActionError('Vui lòng nhập lý do điều chỉnh.');
      return;
    }

    try {
      setPageActionError(null);
      await manualAdjust({
        attendanceId: selectedRecord.id,
        employeeId: selectedRecord.employeeId,
        departmentId: selectedRecord.departmentId ?? null,
        workDate: selectedRecord.date,
        checkInAt: adjustCheckIn
          ? buildIsoDateTime(selectedRecord.date, adjustCheckIn)
          : undefined,
        checkOutAt: adjustCheckOut
          ? buildIsoDateTime(selectedRecord.date, adjustCheckOut)
          : undefined,
        reason: adjustReason.trim(),
        requestedMode: adjustWorkMode,
        publicIp: 'admin-console',
      });
      setIsAdjustModalOpen(false);
      showToast({ type: 'success', message: `Đã điều chỉnh chấm công ngày ${selectedRecord.date} thành công.` });
    } catch (error) {
      const msg = getErrorMessage(error, 'Unable đến manually adjust attendance.');
      setPageActionError(msg);
      showToast({ type: 'error', message: msg });
    }
  };

  const handleReviewRequest = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!selectedRequest) {
      return;
    }

    try {
      setPageActionError(null);
      await approveAdjustmentRequest(selectedRequest.id, {
        decision,
        reviewNote: reviewNote.trim() || undefined,
      });
      setIsApproveModalOpen(false);
      if (decision === 'APPROVED') {
        showToast({ type: 'success', message: 'Đã phê duyệt yêu cầu điều chỉnh chấm công.' });
      } else {
        showToast({ type: 'info', message: 'Đã từ chối yêu cầu điều chỉnh chấm công.' });
      }
    } catch (error) {
      const msg = getErrorMessage(error, 'Unable đến review adjustment request.');
      setPageActionError(msg);
      showToast({ type: 'error', message: msg });
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">
            Quản lý chấm công
          </h2>
        </div>
        <div className="p-6 bg-slate-50/40">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm font-medium text-amber-900">
              Tính năng xem chấm công công ty hiện tại chỉ dành cho Super Admin
            </p>
            <p className="mt-2 text-sm text-amber-800">
              Frontend task 5 đã sử dụng APIs thật, nhưng quyền trên backend cho HR Admin và Manager chưa được mở rộng.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col col-span-1 md:col-span-3 h-[calc(100vh-10rem)]">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
            <div>
              <h3 className="font-semibold text-sm">Quản lý chấm công công ty</h3>
              <p className="mt-1 text-xs text-slate-500">Tháng: {selectedMonth}</p>
              {pageError ? (
                <p className="mt-1 text-xs text-rose-600">{pageError}</p>
              ) : null}
            </div>

            <div className="flex bg-slate-100 p-1 rounded-md">
              <button
                onClick={() => setViewMode('dashboard')}
                className={`px-3 py-1.5 text-xs font-medium rounded flex items-center ${
                  viewMode === 'dashboard'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 mr-1" />
                Dashboard
              </button>
              <button
                onClick={() => setViewMode('company')}
                className={`px-3 py-1.5 text-xs font-medium rounded ${
                  viewMode === 'company'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Danh sách chấm công
              </button>
              <button
                onClick={() => setViewMode('requests')}
                className={`px-3 py-1.5 text-xs font-medium rounded ${
                  viewMode === 'requests'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Yêu cầu ngoại lệ
              </button>
              <button
                onClick={() => setViewMode('reports')}
                className={`px-3 py-1.5 text-xs font-medium rounded flex items-center ${
                  viewMode === 'reports'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 mr-1" />
                Báo cáo nhân viên
              </button>
            </div>
          </div>

          {viewMode !== 'dashboard' ? (
            <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">
                    Tháng
                  </label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={event => setSelectedMonth(event.target.value)}
                    className="w-full rounded-md border border-blue-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">
                    Phòng ban
                  </label>
                  <select
                    value={selectedDepartmentId}
                    onChange={event => setSelectedDepartmentId(event.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Tất cả phòng ban</option>
                    {departments.map(department => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">
                    Nhân viên
                  </label>
                  <select
                    value={selectedEmployeeId}
                    onChange={event => setSelectedEmployeeId(event.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Tất cả nhân viên</option>
                    {employeeOptions.map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} - {employee.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <p>Shared filters apply đến all tabs. Sắp xếp mặc định: mới nhất đến cũ nhất.</p>
                <p>
                  {viewMode === 'company'
                    ? 'Danh sách chấm công'
                    : viewMode === 'requests'
                      ? 'Yêu cầu ngoại lệ'
                      : 'Báo cáo nhân viên'}
                </p>
              </div>
            </div>
          ) : null}

          <div className="flex-1 overflow-auto p-0">
            {viewMode === 'dashboard' ? (
              <div className="p-5">
                <AdminAttendanceDashboard user={user} />
              </div>
            ) : viewMode === 'reports' ? (
              <div className="p-6">
                {isLoading && reports.length === 0 ? (
                  <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>
                ) : null}
                <div className="space-y-4">
                  {paginatedReports.items.map(report => {
                    const employeeSummary = getEmployeeSummary(
                      report.employeeId,
                      employees,
                      departments,
                      report.employeeSnapshot,
                    );

                    return (
                      <div
                        key={report.id}
                        className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between mục-start mb-3">
                          <div>
                            <h4 className="font-semibold text-slate-800">
                              {employeeSummary.title}
                            </h4>
                            <p className="mt-1 text-xs font-medium text-slate-500">
                              {employeeSummary.subtitle}
                            </p>
                            <p className="text-xs text-slate-500">
                              Báo cáo ngày {report.date} - Lần sửa cuối:{' '}
                              {new Date(report.updatedAt).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => setViewingReport(report)}
                            className="text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center text-xs font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Xem chi tiết
                          </button>
                        </div>
                        <div
                          className="prose prose-sm prose-slate max-w-none text-slate-600 line-clamp-3 bg-slate-50 p-3 rounded border border-slate-100"
                          dangerouslySetInnerHTML={{ __html: report.content }}
                        />
                      </div>
                    );
                  })}
                  {!isLoading && paginatedReports.totalItems === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                      <p>Chưa có báo cáo nào</p>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : viewMode === 'requests' ? (
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Nhân viên</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Ngày</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Lý do điều chỉnh</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Trạng thái</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRequests.items.map(request => (
                    <tr key={request.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {getEmployeeSummary(request.employeeId, employees, departments).title}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">{request.workDate}</td>
                      <td
                        className="px-6 py-4 text-sm text-slate-600 max-w-[200px] truncate"
                        title={request.reason}
                      >
                        {request.reason}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase ${getAdjustmentStatusClasses(request.status)}`}
                        >
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openApproveModal(request)}
                          className="text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center text-xs font-medium"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!isLoading && paginatedRequests.totalItems === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                        Chưa có yêu cầu ngoại lệ nào.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Nhân viên</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Ngày</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Check In</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Check Out</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Vị trí</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Trạng thái</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRecords.items.map(record => {
                    const statusMeta = getAttendanceStatusMeta(record);

                    return (
                      <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                          {getEmployeeSummary(record.employeeId, employees, departments).title}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">{record.date}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-mono text-slate-600">{record.checkIn || '--:--'}</span>
                            {record.checkInAt && (
                              <span className={`text-[10px] font-semibold mt-0.5 ${
                                getCheckInStatus(record.checkInAt, '08:00') === 'VALID'
                                  ? 'text-green-600'
                                  : 'text-amber-600'
                              }`}>
                                {getCheckInStatus(record.checkInAt, '08:00') === 'VALID'
                                  ? 'Đúng giờ'
                                  : 'Đi muộn'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-mono text-slate-600">{record.checkOut || '--:--'}</span>
                            {record.checkOutAt ? (
                              <span className={`text-[10px] font-semibold mt-0.5 ${
                                getCheckOutStatus(record.checkOutAt, '17:00') === 'VALID'
                                  ? 'text-green-600'
                                  : 'text-amber-600'
                              }`}>
                                {getCheckOutStatus(record.checkOutAt, '17:00') === 'VALID'
                                  ? 'Hợp lệ'
                                  : 'Về sớm'}
                              </span>
                            ) : record.checkInAt ? (
                              <span className="text-[10px] text-slate-400 mt-0.5">Chưa check-out</span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm text-slate-600">
                            <MapPin className="w-4 h-4 mr-1 text-slate-400" />
                            {record.type}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase ${getStatusBadgeClasses(record.status)}`}
                            >
                              {record.status === 'VALID' ? (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              ) : (
                                <AlertCircle className="w-3 h-3 mr-1" />
                              )}
                              {statusMeta.label}
                            </span>
                            <p className="max-w-[14rem] text-xs text-slate-500">
                              {statusMeta.detail}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => openAdjustModal(record)}
                            className="text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center text-xs font-medium"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            Điều chỉnh
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {!isLoading && paginatedRecords.totalItems === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">
                        Chưa có dữ liệu chấm công công ty cho tháng này.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            )}
          </div>

          <div className="border-t border-slate-100 bg-white px-5 py-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-slate-500">
                Đang xem {activePagination.rangeStart} đến {activePagination.rangeEnd} của {activePagination.totalItems} mục
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span>Số dòng mỗi trang</span>
                  <select
                    value={pageSize}
                    onChange={event => setPageSize(Number(event.target.value))}
                    className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    {PAGE_SIZE_OPTIONS.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage(currentTrang => Math.max(1, currentTrang - 1))}
                    disabled={activePagination.page === 1}
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Trang trước
                  </button>
                  <span className="text-sm text-slate-500">
                    Trang {activePagination.page} của {activePagination.totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPage(currentTrang =>
                        Math.min(activePagination.totalPages, currentTrang + 1),
                      )}
                    disabled={activePagination.page >= activePagination.totalPages}
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Trang sau
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Điều chỉnh chấm công"
      >
        {selectedRecord ? (
          <div className="space-y-4">
            {pageActionError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {pageActionError}
              </div>
            ) : null}

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 text-sm text-slate-700">
              <div className="flex justify-between mb-1">
                <span className="font-medium">Ngày:</span>
                <span>{selectedRecord.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Trạng thái hiện tại:</span>
                <span>{selectedRecord.status}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Giờ Check In</label>
                <input
                  type="time"
                  value={adjustCheckIn}
                  onChange={event => setAdjustCheckIn(event.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Giờ Check Out</label>
                <input
                  type="time"
                  value={adjustCheckOut}
                  onChange={event => setAdjustCheckOut(event.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Chế độ làm việc</label>
              <select
                value={adjustWorkMode}
                onChange={event => setAdjustWorkMode(event.target.value as WorkMode)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              >
                <option value="OFFICE">Office</option>
                <option value="WFH">WFH</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Lý do điều chỉnh</label>
              <textarea
                rows={3}
                value={adjustReason}
                onChange={event => setAdjustReason(event.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                placeholder="Lý do điều chỉnh..."
              />
            </div>

            <div className="pt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleManualAdjust()}
                disabled={isAdjusting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-60"
              >
                {isAdjusting ? 'Đang lưu...' : 'Lưu điều chỉnh'}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        title="Chi tiết yêu cầu ngoại lệ"
      >
        {selectedRequest ? (
          <div className="space-y-4">
            {pageActionError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {pageActionError}
              </div>
            ) : null}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-700 space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Nhân viên:</span>
                <span>
                  {getEmployeeSummary(
                    selectedRequest.employeeId,
                    employees,
                    departments,
                  ).title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Ngày dieu chinh:</span>
                <span>{selectedRequest.workDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Giờ Check In đề xuất:</span>
                <span className="font-mono">{selectedRequest.requestedCheckIn || '--:--'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Giờ Check Out đề xuất:</span>
                <span className="font-mono">{selectedRequest.requestedCheckOut || '--:--'}</span>
              </div>
              <div className="pt-2 mt-2 border-t border-slate-200">
                <span className="font-medium block mb-1">Lý do của nhân viên:</span>
                <p className="text-slate-600 bg-white p-2 rounded border border-slate-100">{selectedRequest.reason}</p>
              </div>
            </div>

            {selectedRequest.status !== 'PENDING' ? (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800 space-y-2">
                <h4 className="font-semibold text-blue-900 mb-2 border-b border-blue-200 pb-1">
                  Lịch sử phê duyệt
                </h4>
                <div className="flex justify-between">
                  <span className="font-medium">Trạng thái:</span>
                  <span className="font-bold">{selectedRequest.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Thời gian duyệt:</span>
                  <span>{selectedRequest.reviewedAt ? new Date(selectedRequest.reviewedAt).toLocaleString() : '--'}</span>
                </div>
                {selectedRequest.reviewNote ? (
                  <div className="pt-2 mt-2 border-t border-blue-200/50">
                    <span className="font-medium block mb-1">Ghi chú:</span>
                    <p className="bg-white/50 p-2 rounded">{selectedRequest.reviewNote}</p>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Ghi chú phê duyệt/từ chối</label>
                  <textarea
                    rows={2}
                    value={reviewNote}
                    onChange={event => setReviewNote(event.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                    placeholder="Nhập lý do phê duyệt hoặc từ chối..."
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => void handleReviewRequest('REJECTED')}
                    disabled={isApprovingAdjustmentRequest}
                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors border border-red-200 disabled:opacity-60"
                  >
                    Từ chối
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleReviewRequest('APPROVED')}
                    disabled={isApprovingAdjustmentRequest}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-60"
                  >
                    Phê duyệt
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={!!viewingReport}
        onClose={() => setViewingReport(null)}
        title="Chi tiết bao cao"
        maxWidth="max-w-4xl"
      >
        {viewingReport ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm text-slate-500 mb-2">
              <span>
                Bởi:{' '}
                <span className="font-medium text-slate-800">
                  {
                    getEmployeeSummary(
                      viewingReport.employeeId,
                      employees,
                      departments,
                      viewingReport.employeeSnapshot,
                    ).title
                  }
                </span>
              </span>
              <span>Ngày: {viewingReport.date}</span>
            </div>

            <div
              className="prose prose-sm prose-slate max-w-none text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-100"
              dangerouslySetInnerHTML={{ __html: viewingReport.content }}
            />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
