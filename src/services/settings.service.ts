import { api } from '../lib/api';

export interface PayrollPolicyConfig {
  standardWorkingDaysInMonth: number;
  insuranceBaseSource: 'BASE_SALARY';
  employeeInsuranceRates: {
    socialInsurance: number;
    healthInsurance: number;
    unemploymentInsurance: number;
  };
  employerInsuranceRates: {
    socialInsurance: number;
    healthInsurance: number;
    unemploymentInsurance: number;
    occupationalAccidentInsurance: number;
  };
  insuranceSalaryCap: number | null;
  regionalMinimumWage: number | null;
  validationRules: {
    warnIfInsuranceBaseBelowRegionalMinimum: boolean;
    warnIfNetSalaryNegative: boolean;
    warnIfPayrollVariancePercentExceeds: number | null;
  };
}

export const settingsService = {
  getPayrollPolicy(): Promise<PayrollPolicyConfig> {
    return api.get<PayrollPolicyConfig>('/settings/payroll-policy');
  },

  savePayrollPolicy(dto: PayrollPolicyConfig): Promise<PayrollPolicyConfig> {
    return api.put<PayrollPolicyConfig>('/settings/payroll-policy', dto);
  },
};
