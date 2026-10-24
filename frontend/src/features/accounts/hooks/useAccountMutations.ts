import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsApi } from '../api/accountsApi';
import type { SaveAccountRequest } from '../types';
import { ACCOUNTS_KEY } from './useAccounts';

export function useAccountMutations() {
  const queryClient = useQueryClient();
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY });

  return {
    save: useMutation({
      mutationFn: ({ id, data }: { id?: string; data: SaveAccountRequest }) =>
        id ? accountsApi.update(id, data) : accountsApi.create(data),
      onSuccess,
    }),
    setArchived: useMutation({
      mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
        archived ? accountsApi.archive(id) : accountsApi.unarchive(id),
      onSuccess,
    }),
    remove: useMutation({ mutationFn: accountsApi.remove, onSuccess }),
  };
}
