import { request } from '@/services/http';
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types';

export const authApi = {
  login: (data: LoginRequest) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: data, authenticated: false }),

  register: (data: RegisterRequest) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: data, authenticated: false }),

  logout: () => request<void>('/auth/logout', { method: 'POST', authenticated: false }),
};
