import { useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../api/categoriesApi';
import type { CreateCategoryRequest } from '../types';
import { CATEGORIES_KEY } from './useCategories';

export function useCategoryMutations() {
  const queryClient = useQueryClient();
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });

  return {
    create: useMutation({ mutationFn: (data: CreateCategoryRequest) => categoriesApi.create(data), onSuccess }),
    rename: useMutation({
      mutationFn: ({ id, name }: { id: string; name: string }) => categoriesApi.rename(id, name),
      onSuccess,
    }),
    setArchived: useMutation({
      mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
        archived ? categoriesApi.archive(id) : categoriesApi.unarchive(id),
      onSuccess,
    }),
    // Mesclar move transações e orçamentos: o que vier deles também precisa recarregar
    merge: useMutation({
      mutationFn: ({ id, targetId }: { id: string; targetId: string }) => categoriesApi.merge(id, targetId),
      onSuccess: () => queryClient.invalidateQueries(),
    }),
    remove: useMutation({ mutationFn: categoriesApi.remove, onSuccess }),
  };
}
