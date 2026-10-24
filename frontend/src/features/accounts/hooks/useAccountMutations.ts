import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsApi } from '../api/accountsApi';
import type { SaveAccountRequest } from '../types';
import { ACCOUNTS_KEY } from './useAccounts';

function useInvalidateAccounts() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY });
}

export function useSaveAccount() {
  const onSuccess = useInvalidateAccounts();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: SaveAccountRequest }) =>
      id ? accountsApi.update(id, data) : accountsApi.create(data),
    onSuccess,
  });
}

export function useSetAccountArchived() {
  const onSuccess = useInvalidateAccounts();
  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      archived ? accountsApi.archive(id) : accountsApi.unarchive(id),
    onSuccess,
  });
}

export function useDeleteAccount() {
  const onSuccess = useInvalidateAccounts();
  return useMutation({ mutationFn: accountsApi.remove, onSuccess });
}
