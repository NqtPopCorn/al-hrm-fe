import { api } from '../lib/api';
import {
  Department,
  Employee,
  EmployeeSensitiveInfo,
  EmployeeWorkStatus,
  Position,
  Role,
} from '../types';

export interface EmployeeListParams {
  search?: string;
  departmentId?: string;
  positionId?: string;
  status?: EmployeeWorkStatus;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EmployeeUpsertPayload {
  code: string;
  name: string;
  personalEmail: string;
  companyEmail: string;
  phone: string;
  role: Role;
  departmentId: string | null;
  positionId: string | null;
  workStatus: EmployeeWorkStatus;
  emailStatus: Employee['emailStatus'];
  joinDate: string;
}

export interface EmployeeSensitiveUpsertPayload {
  baseSalary?: number;
  bankId?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
}

export interface EmployeeImportRowError {
  row: number;
  field: string;
  value?: string;
  message: string;
}

export interface EmployeeImportResponse {
  insertedCount: number;
  fileName: string;
}

export interface DepartmentUpsertPayload {
  name: string;
  code?: string;
  managerId?: string | null;
}

export interface PositionUpsertPayload {
  title: string;
  departmentId: string;
  baseSalary: number;
}

interface ApiEmployee {
  id: string;
  code: string;
  fullName: string;
  personalEmail: string;
  companyEmail: string;
  phone: string;
  avatar?: string;
  role?: string;
  departmentId?: string | null;
  positionId?: string | null;
  workStatus: EmployeeWorkStatus;
  emailStatus: Employee['emailStatus'];
  joinDate: string;
  isActive?: boolean;
  disabledAt?: string | null;
}

interface ApiEmployeeSensitiveInfo {
  employeeId: string;
  baseSalary?: number;
  bankId?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
}

interface ApiDepartment {
  id: string;
  name: string;
  code?: string;
  managerId?: string | null;
  isActive?: boolean;
  disabledAt?: string | null;
}

interface ApiPosition {
  id: string;
  title: string;
  departmentId: string;
  baseSalary: number;
}

function normalizeRole(rawRole?: string): Role {
  const normalized = rawRole?.trim().toLowerCase();

  switch (normalized) {
    case 'super admin':
    case 'super_admin':
      return 'Super Admin';
    case 'hr admin':
    case 'hr_admin':
    case 'hr':
      return 'HR Admin';
    case 'manager':
      return 'Manager';
    default:
      return 'Employee';
  }
}

function toApiRole(role: Role): string {
  switch (role) {
    case 'Super Admin':
      return 'super_admin';
    case 'HR Admin':
      return 'hr_admin';
    case 'Manager':
      return 'manager';
    default:
      return 'employee';
  }
}

function normalizeEmployee(employee: ApiEmployee): Employee {
  return {
    id: employee.id,
    code: employee.code,
    name: employee.fullName,
    personalEmail: employee.personalEmail,
    companyEmail: employee.companyEmail,
    phone: employee.phone,
    avatar: employee.avatar,
    role: normalizeRole(employee.role),
    departmentId: employee.departmentId ?? null,
    positionId: employee.positionId ?? null,
    workStatus: employee.workStatus,
    emailStatus: employee.emailStatus,
    joinDate: employee.joinDate,
    isActive: employee.isActive,
    disabledAt: employee.disabledAt,
  };
}

function normalizeSensitiveInfo(
  sensitiveInfo: ApiEmployeeSensitiveInfo | null,
): EmployeeSensitiveInfo | null {
  if (!sensitiveInfo) {
    return null;
  }

  return {
    employeeId: sensitiveInfo.employeeId,
    baseSalary: sensitiveInfo.baseSalary,
    bankId: sensitiveInfo.bankId,
    bankAccountNumber: sensitiveInfo.bankAccountNumber,
    bankAccountName: sensitiveInfo.bankAccountName,
  };
}

function normalizeDepartment(department: ApiDepartment): Department {
  return {
    id: department.id,
    name: department.name,
    code: department.code,
    managerId: department.managerId ?? null,
    isActive: department.isActive,
    disabledAt: department.disabledAt,
  };
}

function normalizePosition(position: ApiPosition): Position {
  return {
    id: position.id,
    title: position.title,
    departmentId: position.departmentId,
    baseSalary: position.baseSalary,
  };
}

function toApiEmployeePayload(payload: EmployeeUpsertPayload) {
  return {
    code: payload.code,
    fullName: payload.name,
    personalEmail: payload.personalEmail,
    companyEmail: payload.companyEmail,
    phone: payload.phone,
    role: toApiRole(payload.role),
    departmentId: payload.departmentId,
    positionId: payload.positionId,
    workStatus: payload.workStatus,
    emailStatus: payload.emailStatus,
    joinDate: payload.joinDate,
  };
}

function toApiEmployeePatchPayload(payload: Partial<EmployeeUpsertPayload>) {
  return {
    ...(payload.code !== undefined ? { code: payload.code } : {}),
    ...(payload.name !== undefined ? { fullName: payload.name } : {}),
    ...(payload.personalEmail !== undefined
      ? { personalEmail: payload.personalEmail }
      : {}),
    ...(payload.companyEmail !== undefined
      ? { companyEmail: payload.companyEmail }
      : {}),
    ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
    ...(payload.role !== undefined ? { role: toApiRole(payload.role) } : {}),
    ...(payload.departmentId !== undefined
      ? { departmentId: payload.departmentId }
      : {}),
    ...(payload.positionId !== undefined ? { positionId: payload.positionId } : {}),
    ...(payload.workStatus !== undefined
      ? { workStatus: payload.workStatus }
      : {}),
    ...(payload.emailStatus !== undefined
      ? { emailStatus: payload.emailStatus }
      : {}),
    ...(payload.joinDate !== undefined ? { joinDate: payload.joinDate } : {}),
  };
}

export const employeeService = {
  async list(params: EmployeeListParams = {}) {
    const response = await api.get<{
      data: ApiEmployee[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>('/employees', {
      query: params as Record<string, string | number | boolean | null | undefined>,
    });
    return {
      ...response,
      data: response.data.map(normalizeEmployee),
    };
  },

  async getById(employeeId: string) {
    const response = await api.get<ApiEmployee>(`/employees/${employeeId}`);
    return normalizeEmployee(response);
  },

  async getSensitiveInfo(employeeId: string) {
    const response = await api.get<ApiEmployeeSensitiveInfo | null>(
      `/employees/${employeeId}/sensitive`,
    );
    return normalizeSensitiveInfo(response);
  },

  async create(payload: EmployeeUpsertPayload) {
    const response = await api.post<ApiEmployee>(
      '/employees',
      toApiEmployeePayload(payload),
    );
    return normalizeEmployee(response);
  },

  async update(employeeId: string, payload: Partial<EmployeeUpsertPayload>) {
    const response = await api.patch<ApiEmployee>(
      `/employees/${employeeId}`,
      toApiEmployeePatchPayload(payload),
    );
    return normalizeEmployee(response);
  },

  async disableEmployee(employeeId: string) {
    const response = await api.patch<ApiEmployee>(
      `/employees/${employeeId}/disable`,
    );
    return normalizeEmployee(response);
  },

  async updateSensitiveInfo(
    employeeId: string,
    payload: EmployeeSensitiveUpsertPayload,
  ) {
    const response = await api.patch<ApiEmployeeSensitiveInfo>(
      `/employees/${employeeId}/sensitive`,
      payload,
    );
    return normalizeSensitiveInfo(response);
  },

  async importEmployees(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return api.post<EmployeeImportResponse>('/employees/import', formData);
  },

  async listDepartments() {
    const response = await api.get<ApiDepartment[]>('/departments');
    return response.map(normalizeDepartment);
  },

  async createDepartment(payload: DepartmentUpsertPayload) {
    const response = await api.post<ApiDepartment>('/departments', payload);
    return normalizeDepartment(response);
  },

  async updateDepartment(
    departmentId: string,
    payload: Partial<DepartmentUpsertPayload>,
  ) {
    const response = await api.patch<ApiDepartment>(
      `/departments/${departmentId}`,
      payload,
    );
    return normalizeDepartment(response);
  },

  async disableDepartment(departmentId: string) {
    const response = await api.patch<ApiDepartment>(
      `/departments/${departmentId}/disable`,
    );
    return normalizeDepartment(response);
  },

  async listPositions() {
    const response = await api.get<ApiPosition[]>('/positions');
    return response.map(normalizePosition);
  },

  async createPosition(payload: PositionUpsertPayload) {
    const response = await api.post<ApiPosition>('/positions', payload);
    return normalizePosition(response);
  },

  async updatePosition(
    positionId: string,
    payload: Partial<PositionUpsertPayload>,
  ) {
    const response = await api.patch<ApiPosition>(
      `/positions/${positionId}`,
      payload,
    );
    return normalizePosition(response);
  },
};
