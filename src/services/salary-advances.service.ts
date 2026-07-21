import { api } from '../lib/api';

export interface SalaryAdvance {
  id: string;
  employeeId: string;
  periodCode: string;
  date: string;
  amount: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  employee?: {
    fullName: string;
    code: string;
    companyEmail: string;
  };
  approvedBy?: string;
  approvedAt?: string;
  paidBy?: string;
  paidAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSalaryAdvanceDto {
  periodCode: string;
  date: string;
  amount: number;
  reason: string;
}

export interface UpdateSalaryAdvanceStatusDto {
  status: 'APPROVED' | 'REJECTED' | 'PAID';
}

export const salaryAdvancesService = {
  create: async (dto: CreateSalaryAdvanceDto): Promise<SalaryAdvance> => {
    return api.post<SalaryAdvance>('/salary-advances', dto);
  },

  listMine: async (): Promise<SalaryAdvance[]> => {
    return api.get<SalaryAdvance[]>('/salary-advances/me');
  },

  listAll: async (): Promise<SalaryAdvance[]> => {
    return api.get<SalaryAdvance[]>('/salary-advances');
  },

  updateStatus: async (id: string, dto: UpdateSalaryAdvanceStatusDto): Promise<SalaryAdvance> => {
    return api.patch<SalaryAdvance>(`/salary-advances/${id}/status`, dto);
  },
};
