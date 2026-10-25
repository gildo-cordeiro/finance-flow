import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { PAGE_SIZE, transactionsApi } from '../api/transactionsApi';
import type { EntryType, TransactionFilters } from '../types';

export const TRANSACTIONS_KEY = ['transactions'];

export function useTransactions(filters: TransactionFilters) {
  return useInfiniteQuery({
    queryKey: [...TRANSACTIONS_KEY, 'list', filters],
    queryFn: ({ pageParam }) => transactionsApi.list(filters, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.items.length === PAGE_SIZE ? last.page + 1 : undefined),
    placeholderData: keepPreviousData,
  });
}

// Mesmas chaves das features de contas e categorias, para compartilhar o cache
export function useAccountOptions() {
  return useQuery({ queryKey: ['accounts', { includeArchived: false }], queryFn: transactionsApi.accounts });
}

export function useCategoryOptions(type: EntryType) {
  return useQuery({
    queryKey: ['categories', { type, includeArchived: false }],
    queryFn: () => transactionsApi.categories(type),
  });
}

/** A competência sugerida vem do backend (ADR-0008); o frontend só exibe. */
export function useCompetenceSuggestion(accountId: string, date: string) {
  return useQuery({
    queryKey: [...TRANSACTIONS_KEY, 'competence-suggestion', accountId, date],
    queryFn: () => transactionsApi.competenceSuggestion(accountId, date),
    enabled: Boolean(accountId && date),
  });
}
