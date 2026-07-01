import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsApi } from '../api/accounts';
import type { Account, AccountPayload, UpdateAccountPayload } from '../types';
import { useView } from '../../../context/ViewContext';

export function useAccounts() {
  const queryClient = useQueryClient();
  const { viewContext } = useView();

  const { data: accounts = [], isLoading, error } = useQuery<Account[], Error>({
    queryKey: ['accounts', viewContext],
    queryFn: () => accountsApi.listAccounts(),
  });

  const createAccountMutation = useMutation({
    mutationFn: (payload: AccountPayload) => accountsApi.createAccount(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const createAccount = async (payload: AccountPayload) => {
    return createAccountMutation.mutateAsync(payload);
  };

  return {
    accounts,
    isLoading,
    error,
    createAccount,
    isCreating: createAccountMutation.isPending,
    createError: createAccountMutation.error,
  };
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation<Account, Error, { id: string; payload: UpdateAccountPayload }>({
    mutationFn: ({ id, payload }) => accountsApi.updateAccount(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useArchiveAccount() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => accountsApi.archiveAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useUnarchiveAccount() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => accountsApi.unarchiveAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useCloseAccount() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => accountsApi.closeAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => accountsApi.deleteAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}
