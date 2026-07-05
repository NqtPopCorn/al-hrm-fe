import { api } from '../lib/api';
import { PayrollRecord } from '../types';

export const payrollService = {
  list() {
    return api.get<PayrollRecord[]>('/payroll');
  },

  listMine() {
    return api.get<PayrollRecord[]>('/payroll/me');
  },

  getById(payrollId: string) {
    return api.get<PayrollRecord>(`/payroll/${payrollId}`);
  },
};
