import { EmployeeWorkStatus } from '../types';

export const employeeQueryKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeQueryKeys.all, 'list'] as const,
  list: (filters: {
    search?: string;
    departmentId?: string;
    positionId?: string;
    status?: EmployeeWorkStatus;
  }) => [...employeeQueryKeys.lists(), filters] as const,
  sensitive: (employeeId: string) =>
    [...employeeQueryKeys.all, 'sensitive', employeeId] as const,
};

export const departmentQueryKeys = {
  all: ['departments'] as const,
  lists: () => [...departmentQueryKeys.all, 'list'] as const,
  list: () => [...departmentQueryKeys.lists()] as const,
};

export const positionQueryKeys = {
  all: ['positions'] as const,
  lists: () => [...positionQueryKeys.all, 'list'] as const,
  list: () => [...positionQueryKeys.lists()] as const,
};

export const attendanceQueryKeys = {
  all: ['attendance'] as const,
  lists: () => [...attendanceQueryKeys.all, 'list'] as const,
  list: (filters: {
    month?: string;
    employeeId?: string;
    employeeIds?: string[];
    scope: 'self' | 'single' | 'company';
  }) => [...attendanceQueryKeys.lists(), filters] as const,
  adjustmentRequests: (filters?: {
    status?: string;
    employeeId?: string;
  }) => [...attendanceQueryKeys.all, 'adjustment-requests', filters ?? {}] as const,
};

export const dailyReportQueryKeys = {
  all: ['daily-reports'] as const,
  list: (scope: 'me' | 'all') => [...dailyReportQueryKeys.all, scope] as const,
};

export const payrollQueryKeys = {
  all: ['payroll'] as const,
  periods: () => [...payrollQueryKeys.all, 'periods'] as const,
  period: (payrollId: string) => [...payrollQueryKeys.all, 'period', payrollId] as const,
  mine: () => [...payrollQueryKeys.all, 'mine'] as const,
};
