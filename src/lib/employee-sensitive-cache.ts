import type { PaginatedResponse } from '../services/employee.service';
import type { Employee, EmployeeSensitiveInfo } from '../types';

interface SensitiveInfoCacheSourceInput {
  querySensitiveInfo: EmployeeSensitiveInfo | null | undefined;
  employeeSensitiveInfo: EmployeeSensitiveInfo | null | undefined;
}

interface SensitiveInfoCacheSourceResult {
  sensitiveInfo: EmployeeSensitiveInfo | null | undefined;
  shouldFetch: boolean;
}

export function getSensitiveInfoCacheSource(
  input: SensitiveInfoCacheSourceInput,
): SensitiveInfoCacheSourceResult {
  if (input.querySensitiveInfo !== undefined) {
    return {
      sensitiveInfo: input.querySensitiveInfo,
      shouldFetch: false,
    };
  }

  if (input.employeeSensitiveInfo !== undefined) {
    return {
      sensitiveInfo: input.employeeSensitiveInfo,
      shouldFetch: false,
    };
  }

  return {
    sensitiveInfo: undefined,
    shouldFetch: true,
  };
}

export function mergeSensitiveInfoIntoPaginatedEmployees(
  currentData: PaginatedResponse<Employee> | undefined,
  employeeId: string,
  sensitiveInfo: EmployeeSensitiveInfo | null,
): PaginatedResponse<Employee> | undefined {
  if (!currentData) {
    return currentData;
  }

  return {
    ...currentData,
    data: currentData.data.map(employee =>
      employee.id === employeeId
        ? {
            ...employee,
            sensitiveInfo: sensitiveInfo ?? undefined,
          }
        : employee,
    ),
  };
}
