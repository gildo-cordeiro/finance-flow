import { request } from '../../../services/api';
import type { DashboardSummary } from '../types';

export const dashboardApi = {
  async getSummary(month?: string): Promise<DashboardSummary> {
    const url = month ? `/dashboard/summary?month=${month}` : '/dashboard/summary';
    return request<DashboardSummary>(url, {
      method: 'GET',
    });
  },
};
