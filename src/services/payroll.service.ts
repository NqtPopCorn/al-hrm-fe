import { api } from '../lib/api';
import { PayrollItem, PayrollPeriod, PayrollPeriodDetail } from '../types';

export const payrollService = {
  listPeriods() {
    return api.get<PayrollPeriod[]>('/payroll');
  },

  listMine() {
    return api.get<PayrollItem[]>('/payroll/me');
  },

  getPeriodById(payrollId: string) {
    return api.get<PayrollPeriodDetail>(`/payroll/${payrollId}`);
  },

  createPeriod(payload: {
    code: string;
    name: string;
    periodStart: string;
    periodEnd: string;
    standardWorkingDays?: number;
  }) {
    return api.post<PayrollPeriod>('/payroll', payload);
  },

  calculatePeriod(payrollId: string) {
    return api.post<PayrollPeriodDetail>(`/payroll/${payrollId}/calculate`);
  },

  reviewPeriod(payrollId: string) {
    return api.post<PayrollPeriodDetail>(`/payroll/${payrollId}/review`);
  },

  approvePeriod(payrollId: string) {
    return api.post<PayrollPeriodDetail>(`/payroll/${payrollId}/approve`);
  },

  markPeriodPaid(payrollId: string) {
    return api.post<PayrollPeriodDetail>(`/payroll/${payrollId}/mark-paid`);
  },
};
