import { request } from '@/services/http';
import type { Profile, UpdateProfileRequest } from '../types';

export const profileApi = {
  get: () => request<Profile>('/me'),

  update: (data: UpdateProfileRequest) => request<Profile>('/me', { method: 'PUT', body: data }),
};
