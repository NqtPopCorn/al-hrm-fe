import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { employeeQueryKeys } from '../lib/query-keys';
import {
  employeeService,
  EmployeeImportResponse,
  EmployeeImportRowError,
  EmployeeListParams,
  EmployeeSensitiveUpsertPayload,
  EmployeeUpsertPayload,
  PaginatedResponse,
} from '../services/employee.service';
import { Employee, EmployeeSensitiveInfo } from '../types';

interface UseEmployeesOptions extends EmployeeListParams {
  enabled?: boolean;
}

function mergeEmployeeSensitiveInfo(
  employee: Employee,
  sensitiveInfo: EmployeeSensitiveInfo | null,
) {
  return {
    ...employee,
    sensitiveInfo: sensitiveInfo ?? undefined,
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unable to load employees.';
}

export function useEmployees(options: UseEmployeesOptions = {}) {
  const { enabled = true, search, departmentId, positionId, status, page, limit } = options;
  const queryClient = useQueryClient();
  const filters = {
    search,
    departmentId,
    positionId,
    status,
    page,
    limit,
  };
  const employeesQuery = useQuery({
    queryKey: employeeQueryKeys.list(filters),
    queryFn: () => employeeService.list(filters),
    enabled,
    placeholderData: previousData => previousData,
  });

  const refresh = async () => {
    if (!enabled) {
      return [];
    }

    const result = await employeesQuery.refetch();
    return result.data?.data ?? [];
  };

  const createEmployeeMutation = useMutation({
    mutationFn: (payload: EmployeeUpsertPayload) => employeeService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: employeeQueryKeys.lists(),
      });
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: ({
      employeeId,
      payload,
    }: {
      employeeId: string;
      payload: Partial<EmployeeUpsertPayload>;
    }) => employeeService.update(employeeId, payload),
    onSuccess: async updatedEmployee => {
      queryClient.setQueriesData<PaginatedResponse<Employee>>(
        { queryKey: employeeQueryKeys.lists() },
        currentData => {
          if (!currentData) return currentData;
          return {
            ...currentData,
            data: currentData.data.map(employee =>
              employee.id === updatedEmployee.id
                ? {
                    ...updatedEmployee,
                    sensitiveInfo: employee.sensitiveInfo,
                  }
                : employee,
            ),
          };
        },
      );
      await queryClient.invalidateQueries({
        queryKey: employeeQueryKeys.lists(),
      });
    },
  });

  const disableEmployeeMutation = useMutation({
    mutationFn: (employeeId: string) => employeeService.disableEmployee(employeeId),
    onSuccess: async disabledEmployee => {
      queryClient.setQueriesData<PaginatedResponse<Employee>>(
        { queryKey: employeeQueryKeys.lists() },
        currentData => {
          if (!currentData) return currentData;
          return {
            ...currentData,
            data: currentData.data.map(employee =>
              employee.id === disabledEmployee.id
                ? {
                    ...disabledEmployee,
                    sensitiveInfo: employee.sensitiveInfo,
                  }
                : employee,
            ),
          };
        },
      );
      await queryClient.invalidateQueries({
        queryKey: employeeQueryKeys.lists(),
      });
    },
  });

  const getSensitiveInfo = async (employeeId: string) => {
    return queryClient.fetchQuery({
      queryKey: employeeQueryKeys.sensitive(employeeId),
      queryFn: () => employeeService.getSensitiveInfo(employeeId),
    });
  };

  const updateSensitiveInfoMutation = useMutation({
    mutationFn: ({
      employeeId,
      payload,
    }: {
      employeeId: string;
      payload: EmployeeSensitiveUpsertPayload;
    }) => employeeService.updateSensitiveInfo(employeeId, payload),
    onSuccess: async (sensitiveInfo, variables) => {
      queryClient.setQueryData(
        employeeQueryKeys.sensitive(variables.employeeId),
        sensitiveInfo,
      );
      queryClient.setQueriesData<PaginatedResponse<Employee>>(
        { queryKey: employeeQueryKeys.lists() },
        currentData => {
          if (!currentData) return currentData;
          return {
            ...currentData,
            data: currentData.data.map(employee =>
              employee.id === variables.employeeId
                ? mergeEmployeeSensitiveInfo(employee, sensitiveInfo)
                : employee,
            ),
          };
        },
      );
      await queryClient.invalidateQueries({
        queryKey: employeeQueryKeys.lists(),
      });
    },
  });

  const importEmployeesMutation = useMutation({
    mutationFn: (file: File) => employeeService.importEmployees(file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: employeeQueryKeys.lists(),
      });
    },
  });

  const setSensitiveInfo = (
    employeeId: string,
    sensitiveInfo: EmployeeSensitiveInfo | null,
  ) => {
    queryClient.setQueryData(employeeQueryKeys.sensitive(employeeId), sensitiveInfo);
    queryClient.setQueriesData<PaginatedResponse<Employee>>(
      { queryKey: employeeQueryKeys.lists() },
      currentData => {
        if (!currentData) return currentData;
        return {
          ...currentData,
          data: currentData.data.map(employee =>
            employee.id === employeeId
              ? mergeEmployeeSensitiveInfo(employee, sensitiveInfo)
              : employee,
          ),
        };
      },
    );
  };

  return {
    employees: employeesQuery.data?.data ?? [],
    total: employeesQuery.data?.total ?? 0,
    totalPages: employeesQuery.data?.totalPages ?? 0,
    isLoading: employeesQuery.isPending,
    isFetching: employeesQuery.isFetching,
    error: employeesQuery.error ? getErrorMessage(employeesQuery.error) : null,
    refresh,
    createEmployee: (payload: EmployeeUpsertPayload) =>
      createEmployeeMutation.mutateAsync(payload),
    updateEmployee: (
      employeeId: string,
      payload: Partial<EmployeeUpsertPayload>,
    ) => updateEmployeeMutation.mutateAsync({ employeeId, payload }),
    disableEmployee: (employeeId: string) =>
      disableEmployeeMutation.mutateAsync(employeeId),
    getSensitiveInfo,
    updateSensitiveInfo: (
      employeeId: string,
      payload: EmployeeSensitiveUpsertPayload,
    ) => updateSensitiveInfoMutation.mutateAsync({ employeeId, payload }),
    importEmployees: (file: File): Promise<EmployeeImportResponse> =>
      importEmployeesMutation.mutateAsync(file),
    setSensitiveInfo,
    isCreating: createEmployeeMutation.isPending,
    isUpdating: updateEmployeeMutation.isPending,
    isDisabling: disableEmployeeMutation.isPending,
    isUpdatingSensitive: updateSensitiveInfoMutation.isPending,
    isImporting: importEmployeesMutation.isPending,
  };
}
