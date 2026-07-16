import { useState, useEffect } from 'react';
import { Eye, FileText } from 'lucide-react';
import Modal from '../components/Modal';
import { useDailyReports } from '../hooks/useDailyReports';
import { useDepartments } from '../hooks/useDepartments';
import { useEmployees } from '../hooks/useEmployees';
import {
  filterAndPaginateReports,
  getEmployeeOptions,
  getEmployeeSummary,
} from './attendance-view-model';
import { DailyReport, User } from '../types';
import DOMPurify from 'dompurify';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default function DailyReports({ user }: { user: User }) {
  const currentMonth = getCurrentMonth();
  const isSuperAdmin = user.role === 'Super Admin';
  const [viewingReport, setViewingReport] = useState<DailyReport | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  const {
    reports,
    isLoading: isReportsLoading,
    error: reportsError,
  } = useDailyReports({
    scope: 'all',
    enabled: isSuperAdmin,
  });

  const pageError = employeesError || departmentsError || reportsError;
  const isLoading = isEmployeesLoading || isDepartmentsLoading || isReportsLoading;

  const sharedFilters = {
    month: selectedMonth,
    departmentId: selectedDepartmentId,
    employeeId: selectedEmployeeId,
  };

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
  }, [selectedMonth, selectedDepartmentId, selectedEmployeeId, pageSize]);

  useEffect(() => {
    if (
      selectedEmployeeId.length > 0 &&
      !employeeOptions.some(employee => employee.id === selectedEmployeeId)
    ) {
      setSelectedEmployeeId('');
    }
  }, [employeeOptions, selectedEmployeeId]);

  if (!isSuperAdmin) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">
            Quản lý báo cáo cuối ngày
          </h2>
        </div>
        <div className="p-6 bg-slate-50/40">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm font-medium text-amber-900">
              Tính năng xem báo cáo công ty hiện tại chỉ dành cho Super Admin
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-10rem)]">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
          <div>
            <h3 className="font-semibold text-sm flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              Quản lý báo cáo cuối ngày
            </h3>
            {pageError ? (
              <p className="mt-1 text-xs text-rose-600">{pageError}</p>
            ) : null}
          </div>
        </div>

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
        </div>

        <div className="flex-1 overflow-auto p-6">
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
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(report.content) }}
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

        <div className="border-t border-slate-100 bg-white px-5 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-slate-500">
              Đang xem {paginatedReports.rangeStart} đến {paginatedReports.rangeEnd} của {paginatedReports.totalItems} mục
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
                  onClick={() => setPage(currentPage => Math.max(1, currentPage - 1))}
                  disabled={paginatedReports.page === 1}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Trang trước
                </button>
                <span className="text-sm text-slate-500">
                  Trang {paginatedReports.page} của {paginatedReports.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPage(currentPage =>
                      Math.min(paginatedReports.totalPages, currentPage + 1),
                    )
                  }
                  disabled={paginatedReports.page >= paginatedReports.totalPages}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Trang sau
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={!!viewingReport}
        onClose={() => setViewingReport(null)}
        title="Chi tiết báo cáo"
        maxWidth="max-w-4xl"
      >
        {viewingReport ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm text-slate-500 mb-2">
              <span>Ngày: {viewingReport.date}</span>
              <span>
                Nhân viên: {getEmployeeSummary(viewingReport.employeeId, employees, departments).title}
              </span>
            </div>

            <div
              className="prose prose-sm prose-slate max-w-none text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-100"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(viewingReport.content) }}
            />

            <div className="pt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setViewingReport(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
