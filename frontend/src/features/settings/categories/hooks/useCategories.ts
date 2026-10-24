import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '../api/categoriesApi';
import type { CategoryType } from '../types';

export const CATEGORIES_KEY = ['categories'];

export function useCategories(type: CategoryType, includeArchived: boolean) {
  return useQuery({
    queryKey: [...CATEGORIES_KEY, { type, includeArchived }],
    queryFn: () => categoriesApi.tree(type, includeArchived),
  });
}
