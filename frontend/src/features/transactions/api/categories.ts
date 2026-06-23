import { request } from '../../../services/api';
import type { Category, CategoryPayload } from '../types';

export const categoriesApi = {
  async listCategories(): Promise<Category[]> {
    return request<Category[]>('/categories', {
      method: 'GET',
    });
  },

  async createCategory(payload: CategoryPayload): Promise<Category> {
    return request<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateCategory(id: string, payload: CategoryPayload): Promise<Category> {
    return request<Category>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteCategory(id: string): Promise<void> {
    return request<void>(`/categories/${id}`, {
      method: 'DELETE',
    });
  },
};
