import { useQuery } from '@tanstack/react-query';
import { authApi } from '../api/authApi';

/** Versão vigente da política de privacidade, definida pelo backend (RF-102). */
export function usePrivacyPolicy() {
  return useQuery({
    queryKey: ['auth', 'privacy-policy'],
    queryFn: authApi.privacyPolicy,
    staleTime: Infinity,
  });
}
