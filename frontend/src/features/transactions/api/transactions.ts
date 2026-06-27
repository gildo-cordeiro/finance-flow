import { request } from '../../../services/api';
import type { Transaction, TransactionPayload, TransactionFilters } from '../types';

export const transactionsApi = {
  async listTransactions(filters: TransactionFilters): Promise<Transaction[]> {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.accountId) params.append('accountId', filters.accountId);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<Transaction[]>(`/transactions${query}`, {
      method: 'GET',
    });
  },

  async createTransaction(payload: TransactionPayload): Promise<Transaction> {
    return request<Transaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateTransaction(id: string, payload: TransactionPayload, mode: 'ONLY_THIS' | 'ALL' = 'ONLY_THIS'): Promise<Transaction> {
    return request<Transaction>(`/transactions/${id}?mode=${mode}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteTransaction(id: string, mode: 'ONLY_THIS' | 'ALL' = 'ONLY_THIS'): Promise<void> {
    return request<void>(`/transactions/${id}?mode=${mode}`, {
      method: 'DELETE',
    });
  },
};
