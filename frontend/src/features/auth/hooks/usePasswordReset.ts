import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/authApi';

export function useForgotPassword() {
  return useMutation({ mutationFn: authApi.forgotPassword });
}

export function useResetPassword() {
  return useMutation({ mutationFn: authApi.resetPassword });
}
