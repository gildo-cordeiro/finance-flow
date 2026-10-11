import { describe, expect, it } from 'vitest';
import { addDays, subDays, format } from 'date-fns';
import { getGoalDeadlineStatus } from './goalStatus';

describe('getGoalDeadlineStatus (UX-12)', () => {
  const baseGoal = {
    deadline: '2024-12-31',
    status: 'ACTIVE' as const,
    currentAmount: 1000,
    targetAmount: 5000,
  };

  it('marks past deadline in 2024 as overdue with "Atrasada" badge', () => {
    const fixedNow = new Date(2026, 9, 11); // 11 Oct 2026
    const result = getGoalDeadlineStatus(baseGoal, fixedNow);

    expect(result.isOverdue).toBe(true);
    expect(result.isDueSoon).toBe(false);
    expect(result.badge).not.toBeNull();
    expect(result.badge?.label).toBe('Atrasada');
    expect(result.badge?.classes).toBe('bg-danger/[0.16] text-red-300 border-danger/20');
  });

  it('marks yesterday deadline as overdue', () => {
    const fixedNow = new Date(2026, 9, 11);
    const yesterday = format(subDays(fixedNow, 1), 'yyyy-MM-dd');

    const result = getGoalDeadlineStatus({ ...baseGoal, deadline: yesterday }, fixedNow);

    expect(result.isOverdue).toBe(true);
    expect(result.badge?.label).toBe('Atrasada');
    expect(result.badge?.classes).toContain('bg-danger/[0.16]');
    expect(result.badge?.classes).toContain('text-red-300');
  });

  it('shows warning badge "Vence em X dias" when deadline is in 15 days', () => {
    const fixedNow = new Date(2026, 9, 11);
    const in15Days = format(addDays(fixedNow, 15), 'yyyy-MM-dd');

    const result = getGoalDeadlineStatus({ ...baseGoal, deadline: in15Days }, fixedNow);

    expect(result.isOverdue).toBe(false);
    expect(result.isDueSoon).toBe(true);
    expect(result.badge?.label).toBe('Vence em 15 dias');
    expect(result.badge?.classes).toBe('bg-warning/10 text-warning border-warning/20');
  });

  it('shows warning badge "Vence em 1 dia" when deadline is tomorrow', () => {
    const fixedNow = new Date(2026, 9, 11);
    const tomorrow = format(addDays(fixedNow, 1), 'yyyy-MM-dd');

    const result = getGoalDeadlineStatus({ ...baseGoal, deadline: tomorrow }, fixedNow);

    expect(result.isOverdue).toBe(false);
    expect(result.isDueSoon).toBe(true);
    expect(result.badge?.label).toBe('Vence em 1 dia');
    expect(result.badge?.classes).toBe('bg-warning/10 text-warning border-warning/20');
  });

  it('shows warning badge "Vence hoje" when deadline is today', () => {
    const fixedNow = new Date(2026, 9, 11);
    const today = format(fixedNow, 'yyyy-MM-dd');

    const result = getGoalDeadlineStatus({ ...baseGoal, deadline: today }, fixedNow);

    expect(result.isOverdue).toBe(false);
    expect(result.isDueSoon).toBe(true);
    expect(result.badge?.label).toBe('Vence hoje');
    expect(result.badge?.classes).toBe('bg-warning/10 text-warning border-warning/20');
  });

  it('shows warning badge on boundary of 30 days', () => {
    const fixedNow = new Date(2026, 9, 11);
    const in30Days = format(addDays(fixedNow, 30), 'yyyy-MM-dd');

    const result = getGoalDeadlineStatus({ ...baseGoal, deadline: in30Days }, fixedNow);

    expect(result.isOverdue).toBe(false);
    expect(result.isDueSoon).toBe(true);
    expect(result.badge?.label).toBe('Vence em 30 dias');
  });

  it('does not show deadline badge when deadline is further than 30 days', () => {
    const fixedNow = new Date(2026, 9, 11);
    const in31Days = format(addDays(fixedNow, 31), 'yyyy-MM-dd');

    const result = getGoalDeadlineStatus({ ...baseGoal, deadline: in31Days }, fixedNow);

    expect(result.isOverdue).toBe(false);
    expect(result.isDueSoon).toBe(false);
    expect(result.badge).toBeNull();
  });

  it('does not show overdue badge when goal is completed by status', () => {
    const fixedNow = new Date(2026, 9, 11);
    const result = getGoalDeadlineStatus(
      { ...baseGoal, status: 'COMPLETED' },
      fixedNow
    );

    expect(result.isOverdue).toBe(false);
    expect(result.badge).toBeNull();
  });

  it('does not show overdue badge when goal currentAmount has reached targetAmount', () => {
    const fixedNow = new Date(2026, 9, 11);
    const result = getGoalDeadlineStatus(
      { ...baseGoal, currentAmount: 5000, targetAmount: 5000 },
      fixedNow
    );

    expect(result.isOverdue).toBe(false);
    expect(result.badge).toBeNull();
  });

  it('does not show overdue badge when goal is archived', () => {
    const fixedNow = new Date(2026, 9, 11);
    const result = getGoalDeadlineStatus(
      { ...baseGoal, status: 'ARCHIVED' },
      fixedNow
    );

    expect(result.isOverdue).toBe(false);
    expect(result.badge).toBeNull();
  });
});
