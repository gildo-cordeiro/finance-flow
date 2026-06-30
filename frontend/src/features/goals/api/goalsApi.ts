import { Goal, GoalDetail, CreateGoalRequest, UpdateGoalRequest, GoalContributionRequest, GoalContribution } from '../types';
import { request } from '../../../services/api';

export const goalsApi = {
  list: async (): Promise<Goal[]> => {
    return request<Goal[]>('/goals', {
      method: 'GET',
    });
  },

  create: async (data: CreateGoalRequest): Promise<Goal> => {
    return request<Goal>('/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getDetail: async (id: string): Promise<GoalDetail> => {
    return request<GoalDetail>(`/goals/${id}`, {
      method: 'GET',
    });
  },

  update: async (id: string, data: UpdateGoalRequest): Promise<Goal> => {
    return request<Goal>(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<void> => {
    return request<void>(`/goals/${id}`, {
      method: 'DELETE',
    });
  },

  addContribution: async (goalId: string, data: GoalContributionRequest): Promise<GoalContribution> => {
    return request<GoalContribution>(`/goals/${goalId}/contributions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteContribution: async (goalId: string, contributionId: string): Promise<void> => {
    return request<void>(`/goals/${goalId}/contributions/${contributionId}`, {
      method: 'DELETE',
    });
  },

  unarchive: async (id: string): Promise<void> => {
    return request<void>(`/goals/${id}/unarchive`, {
      method: 'POST',
    });
  },
};
