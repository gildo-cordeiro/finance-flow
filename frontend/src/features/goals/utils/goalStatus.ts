import { parseISO, startOfDay, differenceInCalendarDays } from 'date-fns';
import type { Goal } from '../types';

export interface GoalDeadlineStatus {
  isOverdue: boolean;
  isDueSoon: boolean;
  daysRemaining: number;
  badge: {
    label: string;
    classes: string;
  } | null;
}

export function getGoalDeadlineStatus(
  goal: Pick<Goal, 'deadline' | 'status' | 'currentAmount' | 'targetAmount'>,
  currentDate = new Date()
): GoalDeadlineStatus {
  const isCompleted = goal.status === 'COMPLETED' || goal.currentAmount >= goal.targetAmount;
  const isArchived = goal.status === 'ARCHIVED';

  if (isCompleted || isArchived || !goal.deadline) {
    return {
      isOverdue: false,
      isDueSoon: false,
      daysRemaining: 0,
      badge: null,
    };
  }

  const today = startOfDay(currentDate);
  const deadlineDate = startOfDay(parseISO(goal.deadline));
  const diffDays = differenceInCalendarDays(deadlineDate, today);

  if (diffDays < 0) {
    return {
      isOverdue: true,
      isDueSoon: false,
      daysRemaining: diffDays,
      badge: {
        label: 'Atrasada',
        classes: 'bg-danger/[0.16] text-red-300 border-danger/20',
      },
    };
  }

  if (diffDays <= 30) {
    const label =
      diffDays === 0
        ? 'Vence hoje'
        : diffDays === 1
        ? 'Vence em 1 dia'
        : `Vence em ${diffDays} dias`;

    return {
      isOverdue: false,
      isDueSoon: true,
      daysRemaining: diffDays,
      badge: {
        label,
        classes: 'bg-warning/10 text-warning border-warning/20',
      },
    };
  }

  return {
    isOverdue: false,
    isDueSoon: false,
    daysRemaining: diffDays,
    badge: null,
  };
}
