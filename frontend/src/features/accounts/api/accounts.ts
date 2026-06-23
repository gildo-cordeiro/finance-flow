import { request } from '../../../services/api';
import type { Account, AccountPayload } from '../types';

export const accountsApi = {
  async listAccounts(): Promise<Account[]> {
    return request<Account[]>('/accounts', {
      method: 'GET',
    });
  },

  async createAccount(payload: AccountPayload): Promise<Account> {
    return request<Account>('/accounts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
