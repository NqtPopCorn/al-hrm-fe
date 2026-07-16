import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsQueryKeys } from '../lib/query-keys';
import { PayrollPolicyConfig, settingsService } from '../services/settings.service';
import { WorkLocationConfig, workLocationService } from '../services/work-location.service';

export function useSettings(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const queryClient = useQueryClient();

  const payrollPolicyQuery = useQuery({
    queryKey: settingsQueryKeys.payrollPolicy(),
    queryFn: () => settingsService.getPayrollPolicy(),
    enabled,
  });

  const workLocationsQuery = useQuery({
    queryKey: settingsQueryKeys.workLocations(),
    queryFn: () => workLocationService.getActive(),
    enabled,
  });

  const savePayrollPolicyMutation = useMutation({
    mutationFn: (dto: PayrollPolicyConfig) => settingsService.savePayrollPolicy(dto),
    onSuccess: async (updatedPolicy) => {
      queryClient.setQueryData(settingsQueryKeys.payrollPolicy(), updatedPolicy);
      await queryClient.invalidateQueries({ queryKey: settingsQueryKeys.payrollPolicy() });
    },
  });

  const saveWorkLocationMutation = useMutation({
    mutationFn: (dto: Omit<WorkLocationConfig, 'id' | 'isActive'>) => workLocationService.saveConfig(dto),
    onSuccess: async (updatedLocation) => {
      queryClient.setQueryData(settingsQueryKeys.workLocations(), updatedLocation);
      await queryClient.invalidateQueries({ queryKey: settingsQueryKeys.workLocations() });
    },
  });

  return {
    payrollPolicy: payrollPolicyQuery.data ?? null,
    workLocation: workLocationsQuery.data ?? null,
    isPayrollPolicyLoading: payrollPolicyQuery.isPending,
    isWorkLocationLoading: workLocationsQuery.isPending,
    isFetching: payrollPolicyQuery.isFetching || workLocationsQuery.isFetching,
    payrollPolicyError: payrollPolicyQuery.error ? (payrollPolicyQuery.error as Error).message : null,
    workLocationError: workLocationsQuery.error ? (workLocationsQuery.error as Error).message : null,
    refetchPayrollPolicy: payrollPolicyQuery.refetch,
    refetchWorkLocation: workLocationsQuery.refetch,
    savePayrollPolicy: (dto: PayrollPolicyConfig) => savePayrollPolicyMutation.mutateAsync(dto),
    saveWorkLocation: (dto: Omit<WorkLocationConfig, 'id' | 'isActive'>) => saveWorkLocationMutation.mutateAsync(dto),
    isSavingPayrollPolicy: savePayrollPolicyMutation.isPending,
    isSavingWorkLocation: saveWorkLocationMutation.isPending,
  };
}
