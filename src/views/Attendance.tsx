import { useState } from 'react';
import { AlertCircle, CheckCircle, Edit3, Eye, FileText, MapPin } from 'lucide-react';

import Modal from '../components/Modal';
import { getAttendanceStatusMeta } from '../lib/attendance-status';
import { useAttendance } from '../hooks/useAttendance';
import { useDepartments } from '../hooks/useDepartments';
import { useDailyReports } from '../hooks/useDailyReports';
import { useEmployees } from '../hooks/useEmployees';
import {
  AttendanceAdjustmentRequest,
  AttendanceRecord,
  Department,
  DailyReport,
  Employee,
  User,
  WorkMode,
} from '../types';

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

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase();
}

function getDepartmentName(
  departments: Department[],
  departmentId?: string | null,
) {
  if (!departmentId) {
    return 'No department';
  }

  return (
    departments.find(department => department.id === departmentId)?.name ??
    'No department'
  );
}

function getEmployeeSummary(
  employeeId: string,
  employees: Employee[],
  departments: Department[],
  snapshot?: DailyReport['employeeSnapshot'],
) {
  if (snapshot) {
    return {
      title: snapshot.employeeName,
      subtitle: snapshot.employeeCode,
      departmentId: null as string | null,
      searchText:
        `${snapshot.employeeName} ${snapshot.employeeCode}`.toLowerCase(),
    };
  }

  const employee = employees.find(item => item.id === employeeId);

  if (!employee) {
    return {
      title: employeeId,
      subtitle: 'Unknown employee',
      departmentId: null as string | null,
      searchText: employeeId.toLowerCase(),
    };
  }

  const departmentName = getDepartmentName(departments, employee.departmentId);

  return {
    title: employee.name,
    subtitle: `${departmentName} - ${employee.code}`,
    departmentId: employee.departmentId,
    searchText: `${employee.name} ${employee.code} ${departmentName}`.toLowerCase(),
  };
}

export default function Attendance({ user }: { user: User }) {
  const month = getCurrentMonth();
  const isSuperAdmin = user.role === 'Super Admin';
  const [viewMode, setViewMode] = useState<'company' | 'requests' | 'reports'>('company');
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
  const [reportSearch, setReportSearch] = useState('');
  const [reportDepartmentId, setReportDepartmentId] = useState('');
  const [reportMonth, setReportMonth] = useState(month);

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
  const employeeIds = employees.map(employee => employee.id);

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
    month,
    employeeIds,
    enabled: isSuperAdmin && employeeIds.length > 0,
    includeAdjustmentRequests: isSuperAdmin,
  });
  const {
    reports,
    isLoading: isReportsLoading,
    error: reportsError,
  } = useDailyReports({
    scope: 'all',
    enabled: isSuperAdmin,
  });

  const pageError =
    employeesError ||
    departmentsError ||
    attendanceError ||
    adjustmentRequestsError ||
    reportsError;
  const isLoading =
    isEmployeesLoading ||
    isDepartmentsLoading ||
    isAttendanceLoading ||
    isAdjustmentRequestsLoading ||
    isReportsLoading;
  const normalizedReportSearch = normalizeSearchText(reportSearch);
  const filteredReports = reports.filter(report => {
    const employeeSummary = getEmployeeSummary(
      report.employeeId,
      employees,
      departments,
      report.employeeSnapshot,
    );
    const monthMatches =
      reportMonth.length === 0 ? true : report.date.startsWith(reportMonth);
    const departmentMatches =
      reportDepartmentId.length === 0
        ? true
        : employeeSummary.departmentId === reportDepartmentId;
    const searchMatches =
      normalizedReportSearch.length === 0
        ? true
        : employeeSummary.searchText.includes(normalizedReportSearch);

    return monthMatches && departmentMatches && searchMatches;
  });

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
    } catch (error) {
      setPageActionError(
        getErrorMessage(error, 'Unable to manually adjust attendance.'),
      );
    }
  };

  const handleReviewRequest = async (
    decision: 'APPROVED' | 'REJECTED',
  ) => {
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
    } catch (error) {
      setPageActionError(
        getErrorMessage(error, 'Unable to review adjustment request.'),
      );
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
              Live company attendance review is still limited to Super Admin
            </p>
            <p className="mt-2 text-sm text-amber-800">
              Frontend task 5 now uses live APIs, but backend review scopes for HR Admin and Manager have not been expanded yet.
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
              <p className="mt-1 text-xs text-slate-500">Month: {month}</p>
              {pageError ? (
                <p className="mt-1 text-xs text-rose-600">{pageError}</p>
              ) : null}
            </div>

            <div className="flex bg-slate-100 p-1 rounded-md">
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
          <div className="flex-1 overflow-auto p-0">
            {viewMode === 'reports' ? (
              <div className="p-6">
                <div className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">
                      Tim nhan vien
                    </label>
                    <input
                      type="text"
                      value={reportSearch}
                      onChange={event => setReportSearch(event.target.value)}
                      placeholder="Ten hoac ma nhan vien"
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">
                      Phong ban
                    </label>
                    <select
                      value={reportDepartmentId}
                      onChange={event => setReportDepartmentId(event.target.value)}
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="">Tat ca phong ban</option>
                      {departments.map(department => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">
                      Thang bao cao
                    </label>
                    <input
                      type="month"
                      value={reportMonth}
                      onChange={event => setReportMonth(event.target.value)}
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
                {isLoading && reports.length === 0 ? (
                  <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>
                ) : null}
                <div className="space-y-4">
                  {filteredReports.map(report => {
                    const employeeSummary = getEmployeeSummary(
                      report.employeeId,
                      employees,
                      departments,
                    );

                    return (
                    <div
                      key={report.id}
                      className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
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
                  {!isLoading && filteredReports.length === 0 ? (
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
                  {adjustmentRequests.map(request => (
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
                  {!isLoading && adjustmentRequests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                        Chưa có adjustment request nào.
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
                  {records.map(record => {
                    const statusMeta = getAttendanceStatusMeta(record);
                    return (
                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {getEmployeeSummary(record.employeeId, employees, departments).title}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">{record.date}</td>
                      <td className="px-6 py-4 text-sm font-mono text-slate-600">{record.checkIn || '--:--'}</td>
                      <td className="px-6 py-4 text-sm font-mono text-slate-600">{record.checkOut || '--:--'}</td>
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
                  {!isLoading && records.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">
                        Chưa có dữ liệu attendance công ty cho tháng này.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            )}
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
              <label className="block text-xs font-medium text-slate-700 mb-1">Work mode</label>
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
                <span className="font-medium">Ngày điều chỉnh:</span>
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
                  <span className="font-medium">Reviewed at:</span>
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
        title="Chi tiết báo cáo"
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
