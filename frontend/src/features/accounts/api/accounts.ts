import { request } from '../../../services/api';
import type { Account, AccountPayload, UpdateAccountPayload } from '../types';

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

  async updateAccount(id: string, payload: UpdateAccountPayload): Promise<Account> {
    return request<Account>(`/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async archiveAccount(id: string): Promise<void> {
    return request<void>(`/accounts/${id}/archive`, {
      method: 'PATCH',
    });
  },

  async unarchiveAccount(id: string): Promise<void> {
    return request<void>(`/accounts/${id}/unarchive`, {
      method: 'PATCH',
    });
  },

  async closeAccount(id: string): Promise<void> {
    return request<void>(`/accounts/${id}/close`, {
      method: 'PATCH',
    });
  },

  async deleteAccount(id: string): Promise<void> {
    return request<void>(`/accounts/${id}`, {
      method: 'DELETE',
    });
  },
};
