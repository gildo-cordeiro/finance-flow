import { request } from '../../../services/api';
import type { CoupleStatusResponse } from '../types';

export const coupleApi = {
  async getStatus(): Promise<CoupleStatusResponse> {
    return request<CoupleStatusResponse>('/couple', {
      method: 'GET',
    });
  },

  async invitePartner(email: string): Promise<void> {
    return request<void>('/couple/invite', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async acceptInvite(token: string): Promise<void> {
    return request<void>('/couple/accept', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  async declineInvite(): Promise<void> {
    return request<void>('/couple/decline', {
      method: 'POST',
    });
  },

  async dissolveCouple(): Promise<void> {
    return request<void>('/couple', {
      method: 'DELETE',
    });
  },
};
