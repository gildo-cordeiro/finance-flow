import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsApi } from '../api/transactions';
import type { Transaction, TransactionPayload, TransactionFilters } from '../types';

function getLastDayOfMonthStr(monthStr: string) {
  if (!monthStr || monthStr === 'ALL') return '';
  const [year, month] = monthStr.split('-');
  const date = new Date(Number(year), Number(month), 0);
  return `${year}-${month}-${String(date.getDate()).padStart(2, '0')}`;
}

export function useTransactionSummary(
  month: string,
  additionalFilters?: TransactionFilters
) {
  const filters = {
    ...additionalFilters,
    startDate: month !== 'ALL' && !additionalFilters?.startDate ? `${month}-01` : additionalFilters?.startDate,
    endDate: month !== 'ALL' && !additionalFilters?.endDate ? getLastDayOfMonthStr(month) : additionalFilters?.endDate,
  };

  const { data: transactions = [], isLoading, error } = useQuery<Transaction[], Error>({
    queryKey: ['transactions', { month, ...additionalFilters }],
    queryFn: () => transactionsApi.listTransactions(filters),
  });

  const summary = React.useMemo(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach((t) => {
      if (t.type === 'INCOME') {
        income += t.amount;
      } else {
        expense += t.amount;
      }
    });
    return {
      income,
      expense,
      totalCount: transactions.length,
    };
  }, [transactions]);

  return {
    summary,
    isLoading,
    error,
  };
}

export function useTransactions(
  month: string,
  additionalFilters?: TransactionFilters
) {
  const queryClient = useQueryClient();

  const filters = {
    ...additionalFilters,
    startDate: month !== 'ALL' && !additionalFilters?.startDate ? `${month}-01` : additionalFilters?.startDate,
    endDate: month !== 'ALL' && !additionalFilters?.endDate ? getLastDayOfMonthStr(month) : additionalFilters?.endDate,
  };

  const { data: transactions = [], isLoading, error } = useQuery<Transaction[], Error>({
    queryKey: ['transactions', { month, ...additionalFilters }],
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

  const updateTransactionMutation = useMutation({
    mutationFn: ({ id, payload, mode }: { id: string; payload: TransactionPayload; mode: 'ONLY_THIS' | 'ALL' }) =>
      transactionsApi.updateTransaction(id, payload, mode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: ({ id, mode }: { id: string; mode: 'ONLY_THIS' | 'ALL' }) =>
      transactionsApi.deleteTransaction(id, mode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const updateTransaction = async (id: string, payload: TransactionPayload, mode: 'ONLY_THIS' | 'ALL' = 'ONLY_THIS') => {
    return updateTransactionMutation.mutateAsync({ id, payload, mode });
  };

  const deleteTransaction = async (id: string, mode: 'ONLY_THIS' | 'ALL' = 'ONLY_THIS') => {
    return deleteTransactionMutation.mutateAsync({ id, mode });
  };

  return {
    transactions,
    isLoading,
    error,
    createTransaction,
    isCreating: createTransactionMutation.isPending,
    createError: createTransactionMutation.error,
    updateTransaction,
    isUpdating: updateTransactionMutation.isPending,
    updateError: updateTransactionMutation.error,
    deleteTransaction,
    isDeleting: deleteTransactionMutation.isPending,
    deleteError: deleteTransactionMutation.error,
  };
}
