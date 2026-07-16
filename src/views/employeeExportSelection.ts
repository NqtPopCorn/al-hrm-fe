import { Employee } from '../types';

export function getEmployeeExportBlockers(employee: Employee) {
  if (!employee.exportReadiness) {
    return ['Export readiness unavailable'];
  }

  return employee.exportReadiness.canExportDefaultSdlcAccount
    ? []
    : employee.exportReadiness.reasons;
}

export function isEmployeeExportEligible(employee: Employee) {
  return employee.exportReadiness?.canExportDefaultSdlcAccount === true;
}

export function getPageSelectableIds(employees: Employee[]) {
  return employees
    .filter(isEmployeeExportEligible)
    .map(employee => employee.id);
}
