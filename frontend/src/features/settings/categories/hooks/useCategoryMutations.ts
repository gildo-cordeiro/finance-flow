import { useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../api/categoriesApi';
import type { CreateCategoryRequest } from '../types';
import { CATEGORIES_KEY } from './useCategories';

function useInvalidateCategories() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
}

export function useCreateCategory() {
  const onSuccess = useInvalidateCategories();
  return useMutation({ mutationFn: (data: CreateCategoryRequest) => categoriesApi.create(data), onSuccess });
}

export function useRenameCategory() {
  const onSuccess = useInvalidateCategories();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => categoriesApi.rename(id, name),
    onSuccess,
  });
}

export function useSetCategoryArchived() {
  const onSuccess = useInvalidateCategories();
  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      archived ? categoriesApi.archive(id) : categoriesApi.unarchive(id),
    onSuccess,
  });
}

// Mesclar move transações e orçamentos: o que vier deles também precisa recarregar
export function useMergeCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, targetId }: { id: string; targetId: string }) => categoriesApi.merge(id, targetId),
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

export function useDeleteCategory() {
  const onSuccess = useInvalidateCategories();
  return useMutation({ mutationFn: categoriesApi.remove, onSuccess });
}
