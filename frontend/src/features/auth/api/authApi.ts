import { request } from '@/services/http';
import type {
  AuthResponse,
  ForgotPasswordRequest,
  LoginRequest,
  PrivacyPolicy,
  RegisterRequest,
  ResetPasswordRequest,
} from '../types';

export const authApi = {
  login: (data: LoginRequest) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: data, authenticated: false }),

  register: (data: RegisterRequest) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: data, authenticated: false }),

  logout: () => request<void>('/auth/logout', { method: 'POST', authenticated: false }),

  forgotPassword: (data: ForgotPasswordRequest) =>
    request<void>('/auth/password/forgot', { method: 'POST', body: data, authenticated: false }),

  resetPassword: (data: ResetPasswordRequest) =>
    request<void>('/auth/password/reset', { method: 'POST', body: data, authenticated: false }),

  privacyPolicy: () => request<PrivacyPolicy>('/auth/privacy-policy', { authenticated: false }),
};
