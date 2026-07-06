import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { attendanceQueryKeys, dailyReportQueryKeys } from '../lib/query-keys';
import {
  AdjustmentRequestListParams,
  AdjustmentRequestPayload,
  AdjustmentRequestReviewPayload,
  attendanceService,
  AttendanceCheckInPayload,
  AttendanceCheckOutPayload,
  ManualAdjustAttendancePayload,
} from '../services/attendance.service';

interface UseAttendanceOptions {
  month?: string;
  employeeId?: string;
  employeeIds?: string[];
  enabled?: boolean;
  includeAdjustmentRequests?: boolean;
  adjustmentFilters?: AdjustmentRequestListParams;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unable to load attendance data.';
}

export function useAttendance(options: UseAttendanceOptions = {}) {
  const {
    month,
    employeeId,
    employeeIds = [],
    enabled = true,
    includeAdjustmentRequests = false,
    adjustmentFilters,
  } = options;
  const queryClient = useQueryClient();
  const normalizedEmployeeIds = [...new Set(employeeIds)].filter(Boolean);
  const scope = normalizedEmployeeIds.length
    ? 'company'
    : employeeId
      ? 'single'
      : 'self';

  const attendanceQuery = useQuery({
    queryKey: attendanceQueryKeys.list({
      month,
      employeeId,
      employeeIds: normalizedEmployeeIds,
      scope,
    }),
    enabled:
      enabled &&
      (scope !== 'company' || normalizedEmployeeIds.length > 0),
    placeholderData: previousData => previousData,
    queryFn: async () => {
      if (scope === 'company') {
        const recordsByEmployee = await Promise.all(
          normalizedEmployeeIds.map(nextEmployeeId =>
            attendanceService.listMonthlySummary({
              employeeId: nextEmployeeId,
              month,
            }),
          ),
        );

        return recordsByEmployee.flat().sort((left, right) => {
          if (left.date === right.date) {
            return left.employeeId.localeCompare(right.employeeId);
          }

          return right.date.localeCompare(left.date);
        });
      }

      return attendanceService.listMonthlySummary({
        employeeId,
        month,
      });
    },
  });

  const adjustmentRequestsQuery = useQuery({
    queryKey: attendanceQueryKeys.adjustmentRequests(adjustmentFilters),
    enabled: enabled && includeAdjustmentRequests,
    placeholderData: previousData => previousData,
    queryFn: () =>
      attendanceService.listAdjustmentRequests(adjustmentFilters ?? {}),
  });

  const invalidateAttendanceData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: attendanceQueryKeys.all,
      }),
      queryClient.invalidateQueries({
        queryKey: dailyReportQueryKeys.all,
      }),
    ]);
  };

  const checkInMutation = useMutation({
    mutationFn: (payload: AttendanceCheckInPayload) =>
      attendanceService.checkIn(payload),
    onSuccess: invalidateAttendanceData,
  });

  const checkOutMutation = useMutation({
    mutationFn: (payload: AttendanceCheckOutPayload) =>
      attendanceService.checkOut(payload),
    onSuccess: invalidateAttendanceData,
  });

  const manualAdjustMutation = useMutation({
    mutationFn: (payload: ManualAdjustAttendancePayload) =>
      attendanceService.manualAdjust(payload),
    onSuccess: invalidateAttendanceData,
  });

  const createAdjustmentRequestMutation = useMutation({
    mutationFn: (payload: AdjustmentRequestPayload) =>
      attendanceService.createAdjustmentRequest(payload),
    onSuccess: invalidateAttendanceData,
  });

  const approveAdjustmentRequestMutation = useMutation({
    mutationFn: ({
      requestId,
      payload,
    }: {
      requestId: string;
      payload: AdjustmentRequestReviewPayload;
    }) => attendanceService.approveAdjustmentRequest(requestId, payload),
    onSuccess: invalidateAttendanceData,
  });

  return {
    records: attendanceQuery.data ?? [],
    adjustmentRequests: adjustmentRequestsQuery.data ?? [],
    isLoading: attendanceQuery.isPending,
    isFetching: attendanceQuery.isFetching,
    isAdjustmentRequestsLoading: adjustmentRequestsQuery.isPending,
    error: attendanceQuery.error ? getErrorMessage(attendanceQuery.error) : null,
    adjustmentRequestsError: adjustmentRequestsQuery.error
      ? getErrorMessage(adjustmentRequestsQuery.error)
      : null,
    refresh: () => attendanceQuery.refetch(),
    refreshAdjustmentRequests: () => adjustmentRequestsQuery.refetch(),
    checkIn: (payload: AttendanceCheckInPayload) =>
      checkInMutation.mutateAsync(payload),
    checkOut: (payload: AttendanceCheckOutPayload) =>
      checkOutMutation.mutateAsync(payload),
    manualAdjust: (payload: ManualAdjustAttendancePayload) =>
      manualAdjustMutation.mutateAsync(payload),
    createAdjustmentRequest: (payload: AdjustmentRequestPayload) =>
      createAdjustmentRequestMutation.mutateAsync(payload),
    approveAdjustmentRequest: (
      requestId: string,
      payload: AdjustmentRequestReviewPayload,
    ) => approveAdjustmentRequestMutation.mutateAsync({ requestId, payload }),
    isCheckingIn: checkInMutation.isPending,
    isCheckingOut: checkOutMutation.isPending,
    isAdjusting: manualAdjustMutation.isPending,
    isCreatingAdjustmentRequest: createAdjustmentRequestMutation.isPending,
    isApprovingAdjustmentRequest:
      approveAdjustmentRequestMutation.isPending,
  };
}
