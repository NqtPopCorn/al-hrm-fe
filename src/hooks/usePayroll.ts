import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { payrollQueryKeys } from '../lib/query-keys';
import { payrollService } from '../services/payroll.service';

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export function usePayroll(options?: {
  selectedPeriodId?: string | null;
  loadPeriods?: boolean;
  loadMine?: boolean;
}) {
  const {
    selectedPeriodId = null,
    loadPeriods = false,
    loadMine = false,
  } = options ?? {};
  const queryClient = useQueryClient();

  const periodsQuery = useQuery({
    queryKey: payrollQueryKeys.periods(),
    queryFn: () => payrollService.listPeriods(),
    enabled: loadPeriods,
    placeholderData: previousData => previousData,
  });

  const periodDetailQuery = useQuery({
    queryKey: payrollQueryKeys.period(selectedPeriodId ?? 'none'),
    queryFn: () => payrollService.getPeriodById(selectedPeriodId ?? ''),
    enabled: loadPeriods && !!selectedPeriodId,
  });

  const myPayrollQuery = useQuery({
    queryKey: payrollQueryKeys.mine(),
    queryFn: () => payrollService.listMine(),
    enabled: loadMine,
    placeholderData: previousData => previousData,
  });

  const invalidatePayroll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: payrollQueryKeys.all }),
      selectedPeriodId
        ? queryClient.invalidateQueries({
            queryKey: payrollQueryKeys.period(selectedPeriodId),
          })
        : Promise.resolve(),
    ]);
  };

  const createPeriodMutation = useMutation({
    mutationFn: payrollService.createPeriod,
    onSuccess: async createdPeriod => {
      await queryClient.invalidateQueries({
        queryKey: payrollQueryKeys.periods(),
      });
      queryClient.setQueryData(
        payrollQueryKeys.period(createdPeriod.id),
        (currentValue: any) => currentValue,
      );
    },
  });

  const calculatePeriodMutation = useMutation({
    mutationFn: (payrollId: string) => payrollService.calculatePeriod(payrollId),
    onSuccess: invalidatePayroll,
  });

  const reviewPeriodMutation = useMutation({
    mutationFn: (payrollId: string) => payrollService.reviewPeriod(payrollId),
    onSuccess: invalidatePayroll,
  });

  const approvePeriodMutation = useMutation({
    mutationFn: (payrollId: string) => payrollService.approvePeriod(payrollId),
    onSuccess: invalidatePayroll,
  });

  const markPaidMutation = useMutation({
    mutationFn: (payrollId: string) => payrollService.markPeriodPaid(payrollId),
    onSuccess: invalidatePayroll,
  });

  const revertToDraftMutation = useMutation({
    mutationFn: (payrollId: string) => payrollService.revertToDraft(payrollId),
    onSuccess: invalidatePayroll,
  });

  const revertToCalculatedMutation = useMutation({
    mutationFn: (payrollId: string) => payrollService.revertToCalculated(payrollId),
    onSuccess: invalidatePayroll,
  });

  const revertToHrReviewedMutation = useMutation({
    mutationFn: (payrollId: string) => payrollService.revertToHrReviewed(payrollId),
    onSuccess: invalidatePayroll,
  });

  const updateItemManualAdjustmentsMutation = useMutation({
    mutationFn: (input: {
      payrollItemId: string;
      allowance: number;
      bonus: number;
      otherDeduction: number;
      otherDeductionReason?: string | null;
      note?: string;
    }) =>
      payrollService.updateItemManualAdjustments(input.payrollItemId, {
        allowance: input.allowance,
        bonus: input.bonus,
        otherDeduction: input.otherDeduction,
        otherDeductionReason: input.otherDeductionReason,
        note: input.note,
      }),
    onSuccess: invalidatePayroll,
  });

  return {
    periods: periodsQuery.data ?? [],
    selectedPeriod: periodDetailQuery.data ?? null,
    myPayrollItems: myPayrollQuery.data ?? [],
    isPeriodsLoading: periodsQuery.isPending,
    isPeriodLoading: periodDetailQuery.isPending,
    isMyPayrollLoading: myPayrollQuery.isPending,
    periodsError: periodsQuery.error
      ? getErrorMessage(periodsQuery.error, 'Unable to load payroll periods.')
      : null,
    periodError: periodDetailQuery.error
      ? getErrorMessage(periodDetailQuery.error, 'Unable to load payroll detail.')
      : null,
    myPayrollError: myPayrollQuery.error
      ? getErrorMessage(myPayrollQuery.error, 'Unable to load personal payroll.')
      : null,
    refreshPeriods: () => periodsQuery.refetch(),
    refreshSelectedPeriod: () => periodDetailQuery.refetch(),
    refreshMyPayroll: () => myPayrollQuery.refetch(),
    createPeriod: (payload: {
      code: string;
      name: string;
      periodStart: string;
      periodEnd: string;
      standardWorkingDays?: number;
    }) => createPeriodMutation.mutateAsync(payload),
    calculatePeriod: (payrollId: string) =>
      calculatePeriodMutation.mutateAsync(payrollId),
    reviewPeriod: (payrollId: string) =>
      reviewPeriodMutation.mutateAsync(payrollId),
    approvePeriod: (payrollId: string) =>
      approvePeriodMutation.mutateAsync(payrollId),
    markPeriodPaid: (payrollId: string) =>
      markPaidMutation.mutateAsync(payrollId),
    revertToDraft: (payrollId: string) =>
      revertToDraftMutation.mutateAsync(payrollId),
    revertToCalculated: (payrollId: string) =>
      revertToCalculatedMutation.mutateAsync(payrollId),
    revertToHrReviewed: (payrollId: string) =>
      revertToHrReviewedMutation.mutateAsync(payrollId),
    updateItemManualAdjustments: (payload: {
      payrollItemId: string;
      allowance: number;
      bonus: number;
      otherDeduction: number;
      otherDeductionReason?: string | null;
      note?: string;
    }) => updateItemManualAdjustmentsMutation.mutateAsync(payload),
    isCreatingPeriod: createPeriodMutation.isPending,
    isCalculatingPeriod: calculatePeriodMutation.isPending,
    isReviewingPeriod: reviewPeriodMutation.isPending,
    isApprovingPeriod: approvePeriodMutation.isPending,
    isMarkingPaid: markPaidMutation.isPending,
    isRevertingToDraft: revertToDraftMutation.isPending,
    isRevertingToCalculated: revertToCalculatedMutation.isPending,
    isRevertingToHrReviewed: revertToHrReviewedMutation.isPending,
    isUpdatingManualAdjustments: updateItemManualAdjustmentsMutation.isPending,
  };
}
