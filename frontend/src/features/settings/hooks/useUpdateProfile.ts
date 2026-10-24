import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { profileApi } from '../api/profileApi';
import { PROFILE_KEY } from './useProfile';

/** O fuso muda o "hoje" do usuário no backend, então tudo que depende de data é recarregado. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();

  return useMutation({
    mutationFn: profileApi.update,
    onSuccess: (profile) => {
      queryClient.setQueryData(PROFILE_KEY, profile);
      updateUser({ id: profile.id, name: profile.name, email: profile.email });
      return queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] !== PROFILE_KEY[0] });
    },
  });
}
