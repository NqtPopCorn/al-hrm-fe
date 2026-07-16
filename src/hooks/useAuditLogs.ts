import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { auditLogQueryKeys } from '../lib/query-keys';
import { SystemAuditLog, AuditLogStats } from '../types';

interface QueryOptions {
  limit?: number;
  page?: number;
  enabled?: boolean;
}

export function useAuditLogs(options: QueryOptions = {}) {
  const { limit = 5, page = 1, enabled = true } = options;
  const filters = { limit, page };

  const logsQuery = useQuery({
    queryKey: auditLogQueryKeys.list(filters),
    queryFn: () =>
      api.get<{ data: SystemAuditLog[] }>('/audit/logs', {
        query: filters,
      }),
    enabled,
    placeholderData: previousData => previousData,
  });

  const statsQuery = useQuery({
    queryKey: auditLogQueryKeys.stats(),
    queryFn: () => api.get<AuditLogStats>('/audit/stats'),
    enabled,
    placeholderData: previousData => previousData,
  });

  const isLoading = logsQuery.isPending || statsQuery.isPending;
  const error = logsQuery.error
    ? (logsQuery.error as Error).message
    : statsQuery.error
      ? (statsQuery.error as Error).message
      : null;

  return {
    logs: logsQuery.data?.data || [],
    stats: statsQuery.data ?? null,
    isLoading,
    error,
  };
}
