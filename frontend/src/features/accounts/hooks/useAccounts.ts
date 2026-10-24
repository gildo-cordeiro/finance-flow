import { useQuery } from '@tanstack/react-query';
import { accountsApi } from '../api/accountsApi';

export const ACCOUNTS_KEY = ['accounts'];

export function useAccounts(includeArchived: boolean) {
  return useQuery({
    queryKey: [...ACCOUNTS_KEY, { includeArchived }],
    queryFn: () => accountsApi.list(includeArchived),
  });
}
