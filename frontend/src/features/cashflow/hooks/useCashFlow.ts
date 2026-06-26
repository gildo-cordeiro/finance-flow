import { useQuery } from '@tanstack/react-query';
import { cashflowApi } from '../api/cashflow';
import type { CashFlowResponse } from '../types';

export function useCashFlow(from: string, to: string) {
  const { data: projection, isLoading, error, refetch } = useQuery<CashFlowResponse, Error>({
    queryKey: ['cashflowProjection', from, to],
    queryFn: () => cashflowApi.getProjection(from, to),
    enabled: !!from && !!to,
  });

  return {
    projection,
    isLoading,
    error,
    refetch,
  };
}
