import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { departmentQueryKeys, positionQueryKeys } from '../lib/query-keys';
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
  const queryClient = useQueryClient();
  const departmentsQuery = useQuery({
    queryKey: departmentQueryKeys.list(),
    queryFn: () => employeeService.listDepartments(),
    enabled,
  });

  const refresh = async () => {
    if (!enabled) {
      return [];
    }

    const result = await departmentsQuery.refetch();
    return result.data ?? [];
  };

  const createDepartmentMutation = useMutation({
    mutationFn: (payload: DepartmentUpsertPayload) =>
      employeeService.createDepartment(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: departmentQueryKeys.lists(),
      });
    },
  });

  const updateDepartmentMutation = useMutation({
    mutationFn: ({
      departmentId,
      payload,
    }: {
      departmentId: string;
      payload: Partial<DepartmentUpsertPayload>;
    }) => employeeService.updateDepartment(departmentId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: departmentQueryKeys.lists(),
      });
    },
  });

  const disableDepartmentMutation = useMutation({
    mutationFn: (departmentId: string) =>
      employeeService.disableDepartment(departmentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: departmentQueryKeys.lists(),
      });
      await queryClient.invalidateQueries({
        queryKey: positionQueryKeys.lists(),
      });
    },
  });

  return {
    departments: departmentsQuery.data ?? [],
    isLoading: departmentsQuery.isPending,
    isFetching: departmentsQuery.isFetching,
    error:
      departmentsQuery.error ? getErrorMessage(departmentsQuery.error) : null,
    refresh,
    createDepartment: (payload: DepartmentUpsertPayload) =>
      createDepartmentMutation.mutateAsync(payload),
    updateDepartment: (
      departmentId: string,
      payload: Partial<DepartmentUpsertPayload>,
    ) => updateDepartmentMutation.mutateAsync({ departmentId, payload }),
    disableDepartment: (departmentId: string) =>
      disableDepartmentMutation.mutateAsync(departmentId),
    isCreating: createDepartmentMutation.isPending,
    isUpdating: updateDepartmentMutation.isPending,
    isDisabling: disableDepartmentMutation.isPending,
  };
}
