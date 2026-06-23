import { request } from '../../../services/api';
import type { BudgetResponse, BudgetItem, UpdateBudgetPayload } from '../types';

export const budgetApi = {
  async getBudget(month: string): Promise<BudgetResponse> {
    return request<BudgetResponse>(`/budget/${month}`, {
      method: 'GET',
    });
  },

  async updateBudget(month: string, categoryId: string, payload: UpdateBudgetPayload): Promise<BudgetItem> {
    return request<BudgetItem>(`/budget/${month}/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async copyBudget(month: string): Promise<BudgetResponse> {
    return request<BudgetResponse>(`/budget/${month}/copy`, {
      method: 'POST',
    });
  },
};
