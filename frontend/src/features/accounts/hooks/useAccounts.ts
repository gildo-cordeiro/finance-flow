import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsApi } from '../api/accounts';
import type { Account, AccountPayload } from '../types';

export function useAccounts() {
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading, error } = useQuery<Account[], Error>({
    queryKey: ['accounts'],
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
