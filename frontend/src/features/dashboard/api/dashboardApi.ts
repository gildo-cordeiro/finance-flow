import { request } from '@/services/http';
import type { DashboardSummary } from '../types';

export const dashboardApi = {
  summary: (month: string) => request<DashboardSummary>(`/dashboard/summary?month=${month}`),

  pay: (transactionId: string) => request<unknown>(`/transactions/${transactionId}/pay`, { method: 'POST' }),
};
