import { beforeAll, describe, expect, it, vi } from 'vitest';
import { addDays, format } from 'date-fns';
import { GoalCard } from './GoalCard';
import type { Goal } from '../types';

beforeAll(() => {
  if (typeof globalThis.localStorage === 'undefined') {
    globalThis.localStorage = {
      getItem: () => 'BRL',
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    };
  }
});

describe('GoalCard (UX-12 Overdue and Due-Soon badges)', () => {
  const dummyHandlers = {
    onClick: vi.fn(),
    onEdit: vi.fn(),
    onArchive: vi.fn(),
    onUnarchive: vi.fn(),
  };

  const createGoal = (overrides: Partial<Goal> = {}): Goal => ({
    id: 'goal-1',
    userId: 'user-1',
    name: 'Comprar Carro',
    description: 'Reserva para entrada',
    targetAmount: 50000,
    currentAmount: 15000,
    deadline: '2024-12-31',
    status: 'ACTIVE',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
    ...overrides,
  });

  it('acceptance criteria: displays "Atrasada" badge for goal with deadline in 2024', () => {
    const goal = createGoal({ deadline: '2024-06-15' });
    const element = GoalCard({ goal, ...dummyHandlers });

    expect(element).toBeDefined();

    // Find the badges container in title section
    const [, contentContainer] = element.props.children;
    const [titleRow] = contentContainer.props.children;
    const [, badgesContainer] = titleRow.props.children;

    const [overdueBadge] = badgesContainer.props.children;
    expect(overdueBadge).toBeDefined();
    expect(overdueBadge.props.children).toBe('Atrasada');
    expect(overdueBadge.props.className).toContain('bg-danger/[0.16]');
    expect(overdueBadge.props.className).toContain('text-red-300');
    expect(overdueBadge.props.className).toContain('border-danger/20');
  });

  it('paints the deadline date in footer with text-red-300 (#FCA5A5) when overdue', () => {
    const goal = createGoal({ deadline: '2024-12-31' });
    const element = GoalCard({ goal, ...dummyHandlers });

    const [, , footer] = element.props.children;
    const [dateContainer] = footer.props.children;

    expect(dateContainer.props.className).toContain('text-red-300');
    const [, dateSpan] = dateContainer.props.children;
    expect(dateSpan.props.className).toContain('text-red-300');
  });

  it('displays "Vence em X dias" with warning color when deadline is within 30 days', () => {
    const in10Days = format(addDays(new Date(), 10), 'yyyy-MM-dd');
    const goal = createGoal({ deadline: in10Days });
    const element = GoalCard({ goal, ...dummyHandlers });

    const [, contentContainer] = element.props.children;
    const [titleRow] = contentContainer.props.children;
    const [, badgesContainer] = titleRow.props.children;

    const [warningBadge] = badgesContainer.props.children;
    expect(warningBadge).toBeDefined();
    expect(warningBadge.props.children).toBe('Vence em 10 dias');
    expect(warningBadge.props.className).toContain('bg-warning/10');
    expect(warningBadge.props.className).toContain('text-warning');
    expect(warningBadge.props.className).toContain('border-warning/20');

    // Date in footer should not be painted with overdue color
    const [, , footer] = element.props.children;
    const [dateContainer] = footer.props.children;
    expect(dateContainer.props.className).not.toContain('text-red-300');
  });

  it('does not display overdue badge when goal is completed', () => {
    const goal = createGoal({
      deadline: '2024-01-01',
      status: 'COMPLETED',
    });
    const element = GoalCard({ goal, ...dummyHandlers });

    const [, contentContainer] = element.props.children;
    const [titleRow] = contentContainer.props.children;
    const [, badgesContainer] = titleRow.props.children;

    const [deadlineBadge] = badgesContainer.props.children;
    expect(deadlineBadge).toBeNull();
  });

  it('does not display overdue badge when currentAmount >= targetAmount', () => {
    const goal = createGoal({
      deadline: '2024-01-01',
      currentAmount: 50000,
      targetAmount: 50000,
    });
    const element = GoalCard({ goal, ...dummyHandlers });

    const [, contentContainer] = element.props.children;
    const [titleRow] = contentContainer.props.children;
    const [, badgesContainer] = titleRow.props.children;

    const [deadlineBadge] = badgesContainer.props.children;
    expect(deadlineBadge).toBeNull();
  });
});
