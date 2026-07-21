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

  updatePeriod(
    payrollId: string,
    payload: {
      name: string;
    }
  ) {
    return api.patch<PayrollPeriod>(`/payroll/${payrollId}`, payload);
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

  revertToDraft(payrollId: string) {
    return api.post<PayrollPeriodDetail>(`/payroll/${payrollId}/revert-to-draft`);
  },

  revertToCalculated(payrollId: string) {
    return api.post<PayrollPeriodDetail>(`/payroll/${payrollId}/revert-to-calculated`);
  },

  revertToHrReviewed(payrollId: string) {
    return api.post<PayrollPeriodDetail>(`/payroll/${payrollId}/revert-to-hr-reviewed`);
  },

  updateItemManualAdjustments(
    payrollItemId: string,
    payload: {
      allowance: number;
      bonus: number;
      otherDeduction: number;
      otherDeductionReason?: string | null;
      note?: string;
    },
  ) {
    return api.patch<PayrollItem>(
      `/payroll/items/${payrollItemId}/manual-adjustments`,
      payload,
    );
  },

  payPayrollItem(
    payrollItemId: string,
    payload: {
      amount: number;
      method: string;
      note?: string;
    }
  ) {
    return api.post<PayrollItem>(`/payroll/items/${payrollItemId}/pay`, payload);
  },
};
