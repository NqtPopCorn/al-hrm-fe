import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  SalaryAdvance,
  CreateSalaryAdvanceDto,
  UpdateSalaryAdvanceStatusDto,
  salaryAdvancesService,
} from '../services/salary-advances.service';
import { useToast } from '../components/Toast';
import { payrollQueryKeys, salaryAdvancesQueryKeys } from '../lib/query-keys';

export function useSalaryAdvances(isAdmin: boolean) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: salaryAdvancesQueryKeys.list({ isAdmin }),
    queryFn: async () => {
      return isAdmin ? await salaryAdvancesService.listAll() : await salaryAdvancesService.listMine();
    },
    placeholderData: previousData => previousData,
  });

  const createMutation = useMutation({
    mutationFn: async (dto: CreateSalaryAdvanceDto) => {
      return await salaryAdvancesService.create(dto);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: salaryAdvancesQueryKeys.all });
      showToast({ type: 'success', message: 'Gửi yêu cầu tạm ứng thành công' });
    },
    onError: (err: any) => {
      showToast({ type: 'error', message: err.message || 'Lỗi khi tạo yêu cầu tạm ứng' });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateSalaryAdvanceStatusDto }) => {
      return await salaryAdvancesService.updateStatus(id, dto);
    },
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({ queryKey: salaryAdvancesQueryKeys.all });
      if (variables.dto.status === 'PAID') {
        void queryClient.invalidateQueries({ queryKey: payrollQueryKeys.all });
      }
      showToast({ type: 'success', message: 'Cập nhật trạng thái thành công' });
    },
    onError: (err: any) => {
      showToast({ type: 'error', message: err.message || 'Lỗi khi cập nhật trạng thái' });
    },
  });

  return {
    advances: query.data || [],
    isLoading: query.isPending,
    error: query.error?.message || null,
    createAdvance: createMutation.mutateAsync,
    updateStatus: async (id: string, dto: UpdateSalaryAdvanceStatusDto) => {
      return await updateStatusMutation.mutateAsync({ id, dto });
    },
  };
}
