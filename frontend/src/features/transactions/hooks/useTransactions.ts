import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsApi } from '../api/transactions';
import type { Transaction, TransactionPayload, TransactionFilters } from '../types';

export function useTransactions(filters: TransactionFilters) {
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading, error } = useQuery<Transaction[], Error>({
    queryKey: ['transactions', filters],
    queryFn: () => transactionsApi.listTransactions(filters),
  });

  const createTransactionMutation = useMutation({
    mutationFn: (payload: TransactionPayload) => transactionsApi.createTransaction(payload),
    onSuccess: () => {
      // Invalidate both transactions list and accounts balance caches
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const createTransaction = async (payload: TransactionPayload) => {
    return createTransactionMutation.mutateAsync(payload);
  };

  return {
    transactions,
    isLoading,
    error,
    createTransaction,
    isCreating: createTransactionMutation.isPending,
    createError: createTransactionMutation.error,
  };
}
