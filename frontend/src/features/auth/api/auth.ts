import { request } from '../../../services/api';
import type { RegisterPayload, LoginPayload, TokenResponse, UserProfile, UpdateProfilePayload, ChangePasswordPayload } from '../types';


export const authApi = {
  async register(payload: RegisterPayload): Promise<UserProfile> {
    return request<UserProfile>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    });
  },

  async login(payload: LoginPayload): Promise<TokenResponse> {
    return request<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    });
  },

  async getCurrentUser(): Promise<UserProfile> {
    return request<UserProfile>('/users/me', {
      method: 'GET',
    });
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
    return request<UserProfile>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    return request<void>('/users/me/password', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteAccount(): Promise<void> {
    return request<void>('/users/me', {
      method: 'DELETE',
    });
  },
};

