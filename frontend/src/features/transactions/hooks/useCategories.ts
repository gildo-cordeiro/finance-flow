import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../api/categories';
import type { Category, CategoryPayload } from '../types';

export function useCategories() {
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading, error } = useQuery<Category[], Error>({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.listCategories(),
  });

  const createCategoryMutation = useMutation({
    mutationFn: (payload: CategoryPayload) => categoriesApi.createCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CategoryPayload }) =>
      categoriesApi.updateCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const createCategory = async (payload: CategoryPayload) => {
    return createCategoryMutation.mutateAsync(payload);
  };

  const updateCategory = async (id: string, payload: CategoryPayload) => {
    return updateCategoryMutation.mutateAsync({ id, payload });
  };

  const deleteCategory = async (id: string) => {
    return deleteCategoryMutation.mutateAsync(id);
  };

  return {
    categories,
    isLoading,
    error,
    createCategory,
    isCreating: createCategoryMutation.isPending,
    createError: createCategoryMutation.error,
    updateCategory,
    isUpdating: updateCategoryMutation.isPending,
    updateError: updateCategoryMutation.error,
    deleteCategory,
    isDeleting: deleteCategoryMutation.isPending,
    deleteError: deleteCategoryMutation.error,
  };
}
