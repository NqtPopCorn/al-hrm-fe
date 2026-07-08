import {
  AttendanceAdjustmentRequest,
  AttendanceRecord,
  DailyReport,
  Department,
  Employee,
} from '../types.ts';

export interface AttendanceSharedFilters {
  month: string;
  departmentId: string;
  employeeId: string;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  rangeStart: number;
  rangeEnd: number;
}

export interface EmployeeSummary {
  title: string;
  subtitle: string;
  departmentId: string | null;
  searchText: string;
}

interface FilterContext {
  employees: Employee[];
  departments: Department[];
  filters: AttendanceSharedFilters;
}

interface AttendanceRecordParams extends FilterContext {
  records: AttendanceRecord[];
  page: number;
  pageSize: number;
}

interface AdjustmentRequestParams extends FilterContext {
  requests: AttendanceAdjustmentRequest[];
  page: number;
  pageSize: number;
}

interface ReportParams extends FilterContext {
  reports: DailyReport[];
  page: number;
  pageSize: number;
}

function compareStringsAscending(left: string, right: string) {
  return left.localeCompare(right);
}

function compareStringsDescending(left: string, right: string) {
  return right.localeCompare(left);
}

function getDepartmentName(
  departments: Department[],
  departmentId?: string | null,
) {
  if (!departmentId) {
    return 'Không có phòng ban';
  }

  return (
    departments.find(department => department.id === departmentId)?.name ??
    'Không có phòng ban'
  );
}

export function getEmployeeSummary(
  employeeId: string,
  employees: Employee[],
  departments: Department[],
  snapshot?: DailyReport['employeeSnapshot'],
): EmployeeSummary {
  if (snapshot) {
    const snapshotEmployee = employees.find(
      employee => employee.id === snapshot.employeeId,
    );

    return {
      title: snapshot.employeeName,
      subtitle: snapshot.employeeCode,
      departmentId: snapshotEmployee?.departmentId ?? null,
      searchText:
        `${snapshot.employeeName} ${snapshot.employeeCode}`.toLowerCase(),
    };
  }

  const employee = employees.find(item => item.id === employeeId);

  if (!employee) {
    return {
      title: employeeId,
      subtitle: 'Không rõ nhân viên',
      departmentId: null,
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

function matchesSharedFilters(
  employeeSummary: EmployeeSummary,
  workDate: string,
  filters: AttendanceSharedFilters,
) {
  const monthMatches =
    filters.month.length === 0 ? true : workDate.startsWith(filters.month);
  const departmentMatches =
    filters.departmentId.length === 0
      ? true
      : employeeSummary.departmentId === filters.departmentId;
  return monthMatches && departmentMatches;
}

function matchesEmployeeId(
  targetEmployeeId: string,
  filters: AttendanceSharedFilters,
) {
  return filters.employeeId.length === 0 || targetEmployeeId === filters.employeeId;
}

function paginateItems<T>(
  items: T[],
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  const safePageSize = Math.max(1, pageSize);
  const totalItems = items.length;
  const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / safePageSize);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (safePage - 1) * safePageSize;
  const pagedItems = items.slice(startIndex, startIndex + safePageSize);
  const rangeStart = totalItems === 0 ? 0 : startIndex + 1;
  const rangeEnd = totalItems === 0 ? 0 : startIndex + pagedItems.length;

  return {
    items: pagedItems,
    page: safePage,
    pageSize: safePageSize,
    totalItems,
    totalPages,
    rangeStart,
    rangeEnd,
  };
}

export function getEmployeeOptions(
  employees: Employee[],
  filters: Pick<AttendanceSharedFilters, 'departmentId'>,
) {
  return employees
    .filter(employee =>
      filters.departmentId.length === 0
        ? true
        : employee.departmentId === filters.departmentId,
    )
    .sort((left, right) => compareStringsAscending(left.name, right.name));
}

export function filterAndPaginateAttendanceRecords({
  records,
  employees,
  departments,
  filters,
  page,
  pageSize,
}: AttendanceRecordParams) {
  const filteredItems = [...records]
    .filter(record => {
      const employeeSummary = getEmployeeSummary(
        record.employeeId,
        employees,
        departments,
      );

      return (
        matchesSharedFilters(employeeSummary, record.date, filters) &&
        matchesEmployeeId(record.employeeId, filters)
      );
    })
    .sort((left, right) => {
      const dateComparison = compareStringsDescending(left.date, right.date);

      if (dateComparison !== 0) {
        return dateComparison;
      }

      const leftSummary = getEmployeeSummary(
        left.employeeId,
        employees,
        departments,
      );
      const rightSummary = getEmployeeSummary(
        right.employeeId,
        employees,
        departments,
      );

      return compareStringsAscending(leftSummary.title, rightSummary.title);
    });

  return paginateItems(filteredItems, page, pageSize);
}

export function filterAndPaginateAdjustmentRequests({
  requests,
  employees,
  departments,
  filters,
  page,
  pageSize,
}: AdjustmentRequestParams) {
  const filteredItems = [...requests]
    .filter(request => {
      const employeeSummary = getEmployeeSummary(
        request.employeeId,
        employees,
        departments,
      );

      return (
        matchesSharedFilters(employeeSummary, request.workDate, filters) &&
        matchesEmployeeId(request.employeeId, filters)
      );
    })
    .sort((left, right) => {
      const leftTimestamp = left.createdAt ?? left.workDate;
      const rightTimestamp = right.createdAt ?? right.workDate;
      const createdAtComparison = compareStringsDescending(
        leftTimestamp,
        rightTimestamp,
      );

      if (createdAtComparison !== 0) {
        return createdAtComparison;
      }

      return compareStringsDescending(left.workDate, right.workDate);
    });

  return paginateItems(filteredItems, page, pageSize);
}

export function filterAndPaginateReports({
  reports,
  employees,
  departments,
  filters,
  page,
  pageSize,
}: ReportParams) {
  const filteredItems = [...reports]
    .filter(report => {
      const employeeSummary = getEmployeeSummary(
        report.employeeId,
        employees,
        departments,
        report.employeeSnapshot,
      );

      return (
        matchesSharedFilters(employeeSummary, report.date, filters) &&
        matchesEmployeeId(report.employeeId, filters)
      );
    })
    .sort((left, right) => {
      const dateComparison = compareStringsDescending(left.date, right.date);

      if (dateComparison !== 0) {
        return dateComparison;
      }

      return compareStringsDescending(left.updatedAt, right.updatedAt);
    });

  return paginateItems(filteredItems, page, pageSize);
}
