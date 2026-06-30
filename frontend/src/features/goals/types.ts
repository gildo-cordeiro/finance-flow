export interface Goal {
  id: string;
  userId?: string;
  coupleId?: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  userId: string;
  amount: number;
  note?: string;
  contributionDate: string;
  type: 'MANUAL' | 'AUTOMATIC';
  createdAt: string;
}

export interface GoalDetail {
  goal: Goal;
  contributions: GoalContribution[];
  projectedCompletionDate?: string;
}

export interface CreateGoalRequest {
  name: string;
  description?: string;
  targetAmount: number;
  deadline: string;
  isShared?: boolean;
  initialAmount?: number;
}

export interface UpdateGoalRequest {
  name: string;
  description?: string;
  targetAmount: number;
  deadline: string;
}

export interface GoalContributionRequest {
  amount: number;
  note?: string;
  contributionDate: string;
}
