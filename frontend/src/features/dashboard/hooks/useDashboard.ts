import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard';
import type { DashboardSummary } from '../types';

export function useDashboard(month?: string) {
  const { data: summary, isLoading, error, refetch } = useQuery<DashboardSummary, Error>({
    queryKey: ['dashboardSummary', month],
    queryFn: () => dashboardApi.getSummary(month),
  });

  return {
    summary,
    isLoading,
    error,
    refetch,
  };
}
