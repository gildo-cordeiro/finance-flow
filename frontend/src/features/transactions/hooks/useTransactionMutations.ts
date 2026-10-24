import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsApi } from '../api/transactionsApi';
import type { SaveTransactionRequest } from '../types';
import { TRANSACTIONS_KEY } from './useTransactions';

// Uma transação muda a lista, o saldo das contas, o realizado do orçamento e, quando houver, o painel
function useInvalidate() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY }),
      queryClient.invalidateQueries({ queryKey: ['accounts'] }),
      queryClient.invalidateQueries({ queryKey: ['budgets'] }),
    ]);
}

export function useSaveTransaction() {
  const onSuccess = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: SaveTransactionRequest }) =>
      id ? transactionsApi.update(id, data) : transactionsApi.create(data),
    onSuccess,
  });
}

export function useSetTransactionPaid() {
  const onSuccess = useInvalidate();
  return useMutation({
    mutationFn: ({ id, paid }: { id: string; paid: boolean }) =>
      paid ? transactionsApi.pay(id) : transactionsApi.unpay(id),
    onSuccess,
  });
}

export function useDeleteTransaction() {
  const onSuccess = useInvalidate();
  return useMutation({ mutationFn: transactionsApi.remove, onSuccess });
}
