import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { positionQueryKeys } from '../lib/query-keys';
import {
  employeeService,
  PositionUpsertPayload,
} from '../services/employee.service';
import { Position } from '../types';

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unable to load positions.';
}

export function usePositions({ enabled = true }: { enabled?: boolean } = {}) {
  const queryClient = useQueryClient();
  const positionsQuery = useQuery({
    queryKey: positionQueryKeys.list(),
    queryFn: () => employeeService.listPositions(),
    enabled,
  });

  const refresh = async () => {
    if (!enabled) {
      return [];
    }

    const result = await positionsQuery.refetch();
    return result.data ?? [];
  };

  const createPositionMutation = useMutation({
    mutationFn: (payload: PositionUpsertPayload) =>
      employeeService.createPosition(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: positionQueryKeys.lists(),
      });
    },
  });

  const updatePositionMutation = useMutation({
    mutationFn: ({
      positionId,
      payload,
    }: {
      positionId: string;
      payload: Partial<PositionUpsertPayload>;
    }) => employeeService.updatePosition(positionId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: positionQueryKeys.lists(),
      });
    },
  });

  return {
    positions: positionsQuery.data ?? [],
    isLoading: positionsQuery.isPending,
    isFetching: positionsQuery.isFetching,
    error: positionsQuery.error ? getErrorMessage(positionsQuery.error) : null,
    refresh,
    createPosition: (payload: PositionUpsertPayload) =>
      createPositionMutation.mutateAsync(payload),
    updatePosition: (
      positionId: string,
      payload: Partial<PositionUpsertPayload>,
    ) => updatePositionMutation.mutateAsync({ positionId, payload }),
    isCreating: createPositionMutation.isPending,
    isUpdating: updatePositionMutation.isPending,
  };
}
