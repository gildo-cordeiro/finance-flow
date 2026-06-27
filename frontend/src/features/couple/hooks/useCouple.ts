import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coupleApi } from '../api/couple';
import type { CoupleStatusResponse } from '../types';

export function useCouple() {
  const queryClient = useQueryClient();

  const {
    data: coupleStatus = { status: 'NONE' } as CoupleStatusResponse,
    isLoading,
    error,
  } = useQuery<CoupleStatusResponse, Error>({
    queryKey: ['coupleStatus'],
    queryFn: () => coupleApi.getStatus(),
  });

  const invitePartnerMutation = useMutation({
    mutationFn: (email: string) => coupleApi.invitePartner(email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupleStatus'] });
    },
  });

  const acceptInviteMutation = useMutation({
    mutationFn: (token: string) => coupleApi.acceptInvite(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupleStatus'] });
      // Ao aceitar, o contexto pode mudar, então invalidamos tudo
      queryClient.invalidateQueries();
    },
  });

  const declineInviteMutation = useMutation({
    mutationFn: () => coupleApi.declineInvite(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupleStatus'] });
    },
  });

  const dissolveCoupleMutation = useMutation({
    mutationFn: () => coupleApi.dissolveCouple(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupleStatus'] });
      // Ao dissolver, removemos o contexto de casal e invalidamos todas as queries
      localStorage.setItem('view_context', 'PERSONAL');
      queryClient.invalidateQueries();
    },
  });

  return {
    coupleStatus,
    isLoading,
    error,
    invitePartner: invitePartnerMutation.mutateAsync,
    isInviting: invitePartnerMutation.isPending,
    inviteError: invitePartnerMutation.error,
    acceptInvite: acceptInviteMutation.mutateAsync,
    isAccepting: acceptInviteMutation.isPending,
    acceptError: acceptInviteMutation.error,
    declineInvite: declineInviteMutation.mutateAsync,
    isDeclining: declineInviteMutation.isPending,
    declineError: declineInviteMutation.error,
    dissolveCouple: dissolveCoupleMutation.mutateAsync,
    isDissolving: dissolveCoupleMutation.isPending,
    dissolveError: dissolveCoupleMutation.error,
  };
}
