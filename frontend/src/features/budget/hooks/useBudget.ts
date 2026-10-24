import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { budgetApi } from '../api/budgetApi';
import type { Budget } from '../types';

export const BUDGETS_KEY = ['budgets'];

const budgetKey = (month: string) => [...BUDGETS_KEY, month];

export function useBudget(month: string) {
  return useQuery({ queryKey: budgetKey(month), queryFn: () => budgetApi.get(month) });
}

// As duas mutações devolvem o orçamento do mês já recalculado; o mês seguinte e o painel dependem do planejado deste
function useStoreBudget(month: string) {
  const queryClient = useQueryClient();
  return (budget: Budget) => {
    queryClient.setQueryData(budgetKey(month), budget);
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: BUDGETS_KEY, predicate: (query) => query.queryKey[1] !== month }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ]);
  };
}

export function useSetPlanned(month: string) {
  const onSuccess = useStoreBudget(month);
  return useMutation({
    mutationFn: ({ categoryId, amount }: { categoryId: string; amount: number }) =>
      budgetApi.setPlanned(month, categoryId, amount),
    onSuccess,
  });
}

export function useCopyBudget(month: string) {
  const onSuccess = useStoreBudget(month);
  return useMutation({ mutationFn: () => budgetApi.copyFromPrevious(month), onSuccess });
}
