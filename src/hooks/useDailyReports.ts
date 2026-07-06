import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { dailyReportQueryKeys } from '../lib/query-keys';
import { attendanceService } from '../services/attendance.service';

interface UseDailyReportsOptions {
  scope: 'me' | 'all';
  enabled?: boolean;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unable to load daily reports.';
}

export function useDailyReports(options: UseDailyReportsOptions) {
  const { scope, enabled = true } = options;
  const queryClient = useQueryClient();

  const reportsQuery = useQuery({
    queryKey: dailyReportQueryKeys.list(scope),
    enabled,
    placeholderData: previousData => previousData,
    queryFn: () =>
      scope === 'all'
        ? attendanceService.getAllReports()
        : attendanceService.getMyReports(),
  });

  const invalidateReports = async () => {
    await queryClient.invalidateQueries({
      queryKey: dailyReportQueryKeys.all,
    });
  };

  const createReportMutation = useMutation({
    mutationFn: (payload: { employeeId?: string; workDate: string; contentHtml: string }) =>
      attendanceService.createDailyReport(payload),
    onSuccess: invalidateReports,
  });

  const updateReportMutation = useMutation({
    mutationFn: ({
      reportId,
      contentHtml,
    }: {
      reportId: string;
      contentHtml: string;
    }) =>
      attendanceService.updateDailyReport(reportId, {
        contentHtml,
      }),
    onSuccess: invalidateReports,
  });

  return {
    reports: reportsQuery.data ?? [],
    isLoading: reportsQuery.isPending,
    isFetching: reportsQuery.isFetching,
    error: reportsQuery.error ? getErrorMessage(reportsQuery.error) : null,
    refresh: () => reportsQuery.refetch(),
    createReport: (payload: {
      employeeId?: string;
      workDate: string;
      contentHtml: string;
    }) => createReportMutation.mutateAsync(payload),
    updateReport: (reportId: string, contentHtml: string) =>
      updateReportMutation.mutateAsync({ reportId, contentHtml }),
    isCreating: createReportMutation.isPending,
    isUpdating: updateReportMutation.isPending,
  };
}
