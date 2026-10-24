import { request } from '@/services/http';
import type { Category, CategoryType, CreateCategoryRequest } from '../types';

export const categoriesApi = {
  tree: (type: CategoryType, includeArchived: boolean) =>
    request<Category[]>(`/categories?type=${type}&includeArchived=${includeArchived}`),

  create: (data: CreateCategoryRequest) => request<Category>('/categories', { method: 'POST', body: data }),

  rename: (id: string, name: string) => request<Category>(`/categories/${id}`, { method: 'PUT', body: { name } }),

  archive: (id: string) => request<Category>(`/categories/${id}/archive`, { method: 'POST' }),

  unarchive: (id: string) => request<Category>(`/categories/${id}/unarchive`, { method: 'POST' }),

  merge: (id: string, targetId: string) =>
    request<Category>(`/categories/${id}/merge`, { method: 'POST', body: { targetId } }),

  remove: (id: string) => request<void>(`/categories/${id}`, { method: 'DELETE' }),
};
