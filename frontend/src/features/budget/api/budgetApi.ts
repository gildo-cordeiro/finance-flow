import { request } from '@/services/http';
import type { Budget } from '../types';

export const budgetApi = {
  get: (month: string) => request<Budget>(`/budgets/${month}`),

  setPlanned: (month: string, categoryId: string, plannedAmount: number) =>
    request<Budget>(`/budgets/${month}/categories/${categoryId}`, { method: 'PUT', body: { plannedAmount } }),

  copyFromPrevious: (month: string) => request<Budget>(`/budgets/${month}/copy-from-previous`, { method: 'POST' }),
};
