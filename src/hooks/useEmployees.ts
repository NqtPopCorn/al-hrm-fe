import { useEffect, useState } from 'react';

import {
  employeeService,
  EmployeeListParams,
  EmployeeSensitiveUpsertPayload,
  EmployeeUpsertPayload,
} from '../services/employee.service';
import { Employee, EmployeeSensitiveInfo } from '../types';

interface UseEmployeesOptions extends EmployeeListParams {
  enabled?: boolean;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unable to load employees.';
}

export function useEmployees(options: UseEmployeesOptions = {}) {
  const { enabled = true, search, departmentId, positionId, status } = options;
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadEmployees = async () => {
      if (!enabled) {
        setEmployees([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const nextEmployees = await employeeService.list({
          search,
          departmentId,
          positionId,
          status,
        });

        if (!isActive) {
          return;
        }

        setEmployees(nextEmployees);
      } catch (nextError) {
        if (!isActive) {
          return;
        }

        setError(getErrorMessage(nextError));
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadEmployees();

    return () => {
      isActive = false;
    };
  }, [departmentId, enabled, positionId, search, status]);

  const refresh = async () => {
    if (!enabled) {
      setEmployees([]);
      setError(null);
      setIsLoading(false);
      return [];
    }

    try {
      setIsLoading(true);
      setError(null);
      const nextEmployees = await employeeService.list({
        search,
        departmentId,
        positionId,
        status,
      });
      setEmployees(nextEmployees);
      return nextEmployees;
    } catch (nextError) {
      setError(getErrorMessage(nextError));
      throw nextError;
    } finally {
      setIsLoading(false);
    }
  };

  const createEmployee = async (payload: EmployeeUpsertPayload) => {
    const createdEmployee = await employeeService.create(payload);
    setEmployees(currentEmployees => [createdEmployee, ...currentEmployees]);
    return createdEmployee;
  };

  const updateEmployee = async (
    employeeId: string,
    payload: Partial<EmployeeUpsertPayload>,
  ) => {
    const updatedEmployee = await employeeService.update(employeeId, payload);
    setEmployees(currentEmployees =>
      currentEmployees.map(employee =>
        employee.id === employeeId ? updatedEmployee : employee,
      ),
    );
    return updatedEmployee;
  };

  const getSensitiveInfo = async (employeeId: string) => {
    return employeeService.getSensitiveInfo(employeeId);
  };

  const updateSensitiveInfo = async (
    employeeId: string,
    payload: EmployeeSensitiveUpsertPayload,
  ) => {
    return employeeService.updateSensitiveInfo(employeeId, payload);
  };

  const setSensitiveInfo = (
    employeeId: string,
    sensitiveInfo: EmployeeSensitiveInfo | null,
  ) => {
    setEmployees(currentEmployees =>
      currentEmployees.map(employee =>
        employee.id === employeeId
          ? {
              ...employee,
              sensitiveInfo: sensitiveInfo ?? undefined,
            }
          : employee,
      ),
    );
  };

  return {
    employees,
    isLoading,
    error,
    refresh,
    createEmployee,
    updateEmployee,
    getSensitiveInfo,
    updateSensitiveInfo,
    setSensitiveInfo,
  };
}
