import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetApi } from '../api/budget';
import type { BudgetResponse, UpdateBudgetPayload } from '../types';

export function useBudget(month: string) {
  const queryClient = useQueryClient();

  const { data: budget, isLoading, error } = useQuery<BudgetResponse, Error>({
    queryKey: ['budget', month],
    queryFn: () => budgetApi.getBudget(month),
    enabled: !!month && /^\d{4}-\d{2}$/.test(month),
  });

  const updateBudgetMutation = useMutation({
    mutationFn: ({ categoryId, payload }: { categoryId: string; payload: UpdateBudgetPayload }) =>
      budgetApi.updateBudget(month, categoryId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget', month] });
    },
  });

  const copyBudgetMutation = useMutation({
    mutationFn: () => budgetApi.copyBudget(month),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget', month] });
    },
  });

  const updatePlannedAmount = async (categoryId: string, plannedAmount: number) => {
    return updateBudgetMutation.mutateAsync({ categoryId, payload: { plannedAmount } });
  };

  const copyPreviousBudget = async () => {
    return copyBudgetMutation.mutateAsync();
  };

  return {
    budget,
    isLoading,
    error,
    updatePlannedAmount,
    isUpdating: updateBudgetMutation.isPending,
    updateError: updateBudgetMutation.error,
    copyPreviousBudget,
    isCopying: copyBudgetMutation.isPending,
    copyError: copyBudgetMutation.error,
  };
}
