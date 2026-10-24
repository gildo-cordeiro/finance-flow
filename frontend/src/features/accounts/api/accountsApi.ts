import { request } from '@/services/http';
import type { Account, AccountsSummary, SaveAccountRequest } from '../types';

export const accountsApi = {
  summary: () => request<AccountsSummary>('/accounts/summary'),

  list: (includeArchived: boolean) => request<Account[]>(`/accounts?includeArchived=${includeArchived}`),

  create: (data: SaveAccountRequest) => request<Account>('/accounts', { method: 'POST', body: data }),

  update: (id: string, data: SaveAccountRequest) => request<Account>(`/accounts/${id}`, { method: 'PUT', body: data }),

  archive: (id: string) => request<Account>(`/accounts/${id}/archive`, { method: 'POST' }),

  unarchive: (id: string) => request<Account>(`/accounts/${id}/unarchive`, { method: 'POST' }),

  remove: (id: string) => request<void>(`/accounts/${id}`, { method: 'DELETE' }),
};
