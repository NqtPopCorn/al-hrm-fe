import { useEffect, useState } from 'react';

import {
  DepartmentUpsertPayload,
  employeeService,
} from '../services/employee.service';
import { Department } from '../types';

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unable to load departments.';
}

export function useDepartments({ enabled = true }: { enabled?: boolean } = {}) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadDepartments = async () => {
      if (!enabled) {
        setDepartments([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const nextDepartments = await employeeService.listDepartments();

        if (!isActive) {
          return;
        }

        setDepartments(nextDepartments);
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

    loadDepartments();

    return () => {
      isActive = false;
    };
  }, [enabled]);

  const refresh = async () => {
    if (!enabled) {
      setDepartments([]);
      setError(null);
      setIsLoading(false);
      return [];
    }

    try {
      setIsLoading(true);
      setError(null);
      const nextDepartments = await employeeService.listDepartments();
      setDepartments(nextDepartments);
      return nextDepartments;
    } catch (nextError) {
      setError(getErrorMessage(nextError));
      throw nextError;
    } finally {
      setIsLoading(false);
    }
  };

  const createDepartment = async (payload: DepartmentUpsertPayload) => {
    const createdDepartment = await employeeService.createDepartment(payload);
    setDepartments(currentDepartments => [
      ...currentDepartments,
      createdDepartment,
    ]);
    return createdDepartment;
  };

  const updateDepartment = async (
    departmentId: string,
    payload: Partial<DepartmentUpsertPayload>,
  ) => {
    const updatedDepartment = await employeeService.updateDepartment(
      departmentId,
      payload,
    );
    setDepartments(currentDepartments =>
      currentDepartments.map(department =>
        department.id === departmentId ? updatedDepartment : department,
      ),
    );
    return updatedDepartment;
  };

  return {
    departments,
    isLoading,
    error,
    refresh,
    createDepartment,
    updateDepartment,
  };
}
