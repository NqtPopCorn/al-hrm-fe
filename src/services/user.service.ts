import { api } from '../lib/api';
import { AccountStatus, Role, UserAccount } from '../types';

export interface UserListParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedUsersResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserAccountCreatePayload {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  role: Role;
  status: AccountStatus;
}

export interface UserAccountUpdatePayload {
  email: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  password?: string;
}

interface ApiUserAccount {
  id: string;
  email: string;
  role?: string;
  status: AccountStatus;
  fullName?: string;
  phone?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
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

function normalizeUserAccount(account: ApiUserAccount): UserAccount {
  return {
    id: account.id,
    email: account.email,
    fullName: account.fullName?.trim() || account.email.split('@')[0],
    phone: account.phone,
    role: normalizeRole(account.role),
    status: account.status,
    avatar: account.avatar,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}

function toCreatePayload(payload: UserAccountCreatePayload) {
  return {
    email: payload.email.trim(),
    password: payload.password,
    fullName: payload.fullName.trim(),
    ...(payload.phone?.trim() ? { phone: payload.phone.trim() } : {}),
    ...(payload.avatar?.trim() ? { avatar: payload.avatar.trim() } : {}),
    role: toApiRole(payload.role),
    status: payload.status,
  };
}

function toUpdatePayload(payload: UserAccountUpdatePayload) {
  return {
    email: payload.email.trim(),
    fullName: payload.fullName.trim(),
    ...(payload.phone?.trim() ? { phone: payload.phone.trim() } : {}),
    ...(payload.avatar?.trim() ? { avatar: payload.avatar.trim() } : {}),
    ...(payload.password?.trim() ? { password: payload.password } : {}),
  };
}

export const userService = {
  async list(params: UserListParams = {}) {
    const response = await api.get<PaginatedUsersResponse<ApiUserAccount>>(
      '/users',
      {
        query: params as Record<string, string | number | boolean | null | undefined>,
      },
    );

    return {
      ...response,
      data: response.data.map(normalizeUserAccount),
    };
  },

  async create(payload: UserAccountCreatePayload) {
    const response = await api.post<ApiUserAccount>(
      '/users',
      toCreatePayload(payload),
    );
    return normalizeUserAccount(response);
  },

  async update(userId: string, payload: UserAccountUpdatePayload) {
    const response = await api.put<ApiUserAccount>(
      `/users/${userId}`,
      toUpdatePayload(payload),
    );
    return normalizeUserAccount(response);
  },

  async updateRole(userId: string, role: Role) {
    const response = await api.put<ApiUserAccount>(`/users/${userId}/role`, {
      role: toApiRole(role),
    });
    return normalizeUserAccount(response);
  },

  async updateStatus(userId: string, status: AccountStatus) {
    const response = await api.put<ApiUserAccount>(`/users/${userId}/status`, {
      status,
    });
    return normalizeUserAccount(response);
  },

  async remove(userId: string) {
    return api.delete<{ message: string }>(`/users/${userId}`);
  },
};
