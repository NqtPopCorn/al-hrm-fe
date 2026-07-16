import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { employeeQueryKeys } from '../lib/query-keys';
import {
  getSensitiveInfoCacheSource,
  mergeSensitiveInfoIntoPaginatedEmployees,
} from '../lib/employee-sensitive-cache';
import {
  employeeService,
  EmployeeImportResponse,
  EmployeeImportRowError,
  EmployeeListParams,
  EmployeeSensitiveUpsertPayload,
  EmployeeUpsertPayload,
  ExportDefaultSdlcAccountsResult,
  PaginatedResponse,
} from '../services/employee.service';
import { Employee, EmployeeSensitiveInfo } from '../types';

interface UseEmployeesOptions extends EmployeeListParams {
  enabled?: boolean;
}

const SENSITIVE_INFO_STALE_TIME = 10 * 60_000;
const SENSITIVE_INFO_GC_TIME = 30 * 60_000;

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
        currentData =>
          currentData
            ? {
                ...currentData,
                data: currentData.data.map(employee =>
                  employee.id === updatedEmployee.id
                    ? {
                        ...updatedEmployee,
                        sensitiveInfo: employee.sensitiveInfo,
                      }
                    : employee,
                ),
              }
            : currentData,
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
        currentData =>
          currentData
            ? {
                ...currentData,
                data: currentData.data.map(employee =>
                  employee.id === disabledEmployee.id
                    ? {
                        ...disabledEmployee,
                        sensitiveInfo: employee.sensitiveInfo,
                      }
                    : employee,
                ),
              }
            : currentData,
      );
      await queryClient.invalidateQueries({
        queryKey: employeeQueryKeys.lists(),
      });
    },
  });

  const getCachedSensitiveInfo = (
    employeeId: string,
    employeeSensitiveInfo?: EmployeeSensitiveInfo | null,
  ) => {
    const queryKey = employeeQueryKeys.sensitive(employeeId);
    const querySensitiveInfo = queryClient.getQueryData<EmployeeSensitiveInfo | null>(
      queryKey,
    );
    const cacheSource = getSensitiveInfoCacheSource({
      querySensitiveInfo,
      employeeSensitiveInfo,
    });

    if (cacheSource.shouldFetch) {
      return undefined;
    }

    if (querySensitiveInfo === undefined) {
      queryClient.setQueryData(queryKey, cacheSource.sensitiveInfo ?? null);
    }

    return cacheSource.sensitiveInfo ?? null;
  };

  const getSensitiveInfo = async (
    employeeId: string,
    employeeSensitiveInfo?: EmployeeSensitiveInfo | null,
  ) => {
    const cachedSensitiveInfo = getCachedSensitiveInfo(
      employeeId,
      employeeSensitiveInfo,
    );

    if (cachedSensitiveInfo !== undefined) {
      return cachedSensitiveInfo;
    }

    return queryClient.fetchQuery({
      queryKey: employeeQueryKeys.sensitive(employeeId),
      queryFn: () => employeeService.getSensitiveInfo(employeeId),
      staleTime: SENSITIVE_INFO_STALE_TIME,
      gcTime: SENSITIVE_INFO_GC_TIME,
    });
  };

  const exportDefaultSdlcAccountsMutation = useMutation({
    mutationFn: (employeeIds: string[]) =>
      employeeService.exportDefaultSdlcAccounts(employeeIds),
  });

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
        currentData =>
          mergeSensitiveInfoIntoPaginatedEmployees(
            currentData,
            variables.employeeId,
            sensitiveInfo,
          ),
      );
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
      currentData =>
        mergeSensitiveInfoIntoPaginatedEmployees(
          currentData,
          employeeId,
          sensitiveInfo,
        ),
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
    getCachedSensitiveInfo,
    getSensitiveInfo,
    updateSensitiveInfo: (
      employeeId: string,
      payload: EmployeeSensitiveUpsertPayload,
    ) => updateSensitiveInfoMutation.mutateAsync({ employeeId, payload }),
    importEmployees: (file: File): Promise<EmployeeImportResponse> =>
      importEmployeesMutation.mutateAsync(file),
    exportDefaultSdlcAccounts: (
      employeeIds: string[],
    ): Promise<ExportDefaultSdlcAccountsResult> =>
      exportDefaultSdlcAccountsMutation.mutateAsync(employeeIds),
    setSensitiveInfo,
    isCreating: createEmployeeMutation.isPending,
    isUpdating: updateEmployeeMutation.isPending,
    isDisabling: disableEmployeeMutation.isPending,
    isUpdatingSensitive: updateSensitiveInfoMutation.isPending,
    isImporting: importEmployeesMutation.isPending,
    isExportingDefaultSdlcAccounts:
      exportDefaultSdlcAccountsMutation.isPending,
  };
}

export function useEmployee(employeeId?: string | null, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  
  const employeeQuery = useQuery({
    queryKey: [...employeeQueryKeys.all, employeeId!],
    queryFn: () => employeeService.getById(employeeId!),
    enabled: enabled && !!employeeId,
  });

  return {
    employee: employeeQuery.data ?? null,
    isLoading: !!employeeId && employeeQuery.isPending,
    isFetching: !!employeeId && employeeQuery.isFetching,
    error: employeeQuery.error ? getErrorMessage(employeeQuery.error) : null,
    refetch: employeeQuery.refetch,
  };
}

export function useEmployeeSensitiveInfo(employeeId?: string | null, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;

  const sensitiveQuery = useQuery({
    queryKey: employeeQueryKeys.sensitive(employeeId!),
    queryFn: () => employeeService.getSensitiveInfo(employeeId!),
    enabled: enabled && !!employeeId,
  });

  return {
    sensitiveInfo: sensitiveQuery.data ?? null,
    isLoading: sensitiveQuery.isPending,
    isFetching: sensitiveQuery.isFetching,
    error: sensitiveQuery.error ? getErrorMessage(sensitiveQuery.error) : null,
    refetch: sensitiveQuery.refetch,
  };
}
