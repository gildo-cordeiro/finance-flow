import { endOfMonth, format, parseISO } from 'date-fns';
import { request } from '@/services/http';
import type {
  AccountOption,
  CategoryOption,
  EntryType,
  SaveTransactionRequest,
  Transaction,
  TransactionFilters,
  TransactionPage,
} from '../types';

export const PAGE_SIZE = 50;

function listQuery(filters: TransactionFilters, page: number) {
  const first = parseISO(`${filters.month}-01`);
  const params = new URLSearchParams({
    from: format(first, 'yyyy-MM-dd'),
    to: format(endOfMonth(first), 'yyyy-MM-dd'),
    dateField: filters.dateField,
    page: String(page),
    size: String(PAGE_SIZE),
  });
  if (filters.type) params.set('type', filters.type);
  if (filters.accountId) params.set('accountId', filters.accountId);
  if (filters.categoryId) params.set('categoryId', filters.categoryId);
  if (filters.status) params.set('status', filters.status);
  if (filters.q.trim()) params.set('q', filters.q.trim());
  return params.toString();
}

export const transactionsApi = {
  list: (filters: TransactionFilters, page: number) =>
    request<TransactionPage>(`/transactions?${listQuery(filters, page)}`),

  create: (data: SaveTransactionRequest) => request<Transaction>('/transactions', { method: 'POST', body: data }),

  update: (id: string, data: SaveTransactionRequest) =>
    request<Transaction>(`/transactions/${id}`, { method: 'PUT', body: data }),

  remove: (id: string) => request<void>(`/transactions/${id}`, { method: 'DELETE' }),

  pay: (id: string) => request<Transaction>(`/transactions/${id}/pay`, { method: 'POST' }),

  unpay: (id: string) => request<Transaction>(`/transactions/${id}/unpay`, { method: 'POST' }),

  competenceSuggestion: (accountId: string, date: string) =>
    request<{ competenceMonth: string }>(
      `/transactions/competence-suggestion?accountId=${accountId}&date=${date}`
    ),

  accounts: () => request<AccountOption[]>('/accounts?includeArchived=false'),

  categories: (type: EntryType) => request<CategoryOption[]>(`/categories?type=${type}&includeArchived=false`),
};
