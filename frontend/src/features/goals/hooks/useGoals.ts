import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalsApi } from '../api/goalsApi';
import { CreateGoalRequest, UpdateGoalRequest, GoalContributionRequest } from '../types';
import type { ApiError } from '../../auth/types';
import { useView } from '../../../context/ViewContext';

export function useGoals() {
  const { viewContext } = useView();

  return useQuery({
    queryKey: ['goals', { viewContext }],
    queryFn: goalsApi.list,
  });
}

export function useGoal(id: string) {
  return useQuery({
    queryKey: ['goal', id],
    queryFn: () => goalsApi.getDetail(id),
    enabled: !!id,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation<any, ApiError, CreateGoalRequest>({
    mutationFn: goalsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow'] });
    },
  });
}

export function useUpdateGoal(id: string) {
  const queryClient = useQueryClient();

  return useMutation<any, ApiError, UpdateGoalRequest>({
    mutationFn: (data) => goalsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal', id] });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: goalsApi.delete,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal', id] });
    },
  });
}

export function useAddContribution(goalId: string) {
  const queryClient = useQueryClient();

  return useMutation<any, ApiError, GoalContributionRequest>({
    mutationFn: (data) => goalsApi.addContribution(goalId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal', goalId] });
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow'] });
    },
  });
}

export function useDeleteContribution(goalId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (contributionId) => goalsApi.deleteContribution(goalId, contributionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal', goalId] });
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow'] });
    },
  });
}

export function useUnarchiveGoal() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: goalsApi.unarchive,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal', id] });
    },
  });
}
