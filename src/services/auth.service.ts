import { ApiError, api } from '../lib/api';
import { Role, User } from '../types';

interface AuthApiUser {
  id: string;
  email: string;
  role?: string;
  fullName?: string;
  name?: string;
  avatar?: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  user: AuthApiUser;
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

function normalizeUser(user: AuthApiUser): User {
  const fallbackName = user.email.split('@')[0];

  return {
    id: user.id,
    email: user.email,
    role: normalizeRole(user.role),
    name: user.fullName || user.name || fallbackName,
    avatar: user.avatar,
  };
}

export const authService = {
  async login(payload: LoginPayload) {
    const response = await api.post<LoginResponse>('/auth/login', payload);
    return normalizeUser(response.user);
  },

  async me() {
    const response = await api.get<AuthApiUser>('/auth/me');
    return normalizeUser(response);
  },

  async refresh() {
    return api.post<{ success: boolean; message: string }>('/auth/refresh');
  },

  async logout() {
    return api.post<{ success: boolean; message: string }>('/auth/logout');
  },

  isAuthError(error: unknown) {
    return error instanceof ApiError && error.status === 401;
  },
};
