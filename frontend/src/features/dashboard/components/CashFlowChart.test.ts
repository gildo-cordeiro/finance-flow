import { describe, expect, it } from 'vitest';
import { aggregateTransactionsByMonth } from '../utils/aggregateCashFlow';
import {
  type Transaction,
  TransactionStatus,
  TransactionType,
  TransactionVisibility,
} from '../../transactions/types';

const createMockTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'tx-1',
  userId: 'user-1',
  accountId: 'acc-1',
  categoryId: 'cat-1',
  description: 'Salário',
  amount: 5000,
  type: TransactionType.INCOME,
  competenceDate: '2026-10-01',
  dueDate: '2026-10-05',
  status: TransactionStatus.PAID,
  visibility: TransactionVisibility.PERSONAL,
  isRecurring: false,
  ...overrides,
});

describe('aggregateTransactionsByMonth (UX-09 CashFlow Projection)', () => {
  it('shows 0 and projected: false for previous months when a single non-recurring transaction exists in October', () => {
    const singleTx = createMockTransaction({
      competenceDate: '2026-10-15',
      amount: 5000,
      type: TransactionType.INCOME,
      status: TransactionStatus.PAID,
      isRecurring: false,
    });

    const result = aggregateTransactionsByMonth([singleTx], '2026-10', 'user-1', false);

    expect(result).toHaveLength(6);

    // First 5 months (May to September) have 0 revenue and expenses, and projected is false
    for (let i = 0; i < 5; i++) {
      expect(result[i].receitas).toBe(0);
      expect(result[i].despesas).toBe(0);
      expect(result[i].projected).toBe(false);
    }

    // October (last month in the 6-month window) has 5000 revenue and projected is false
    const october = result[5];
    expect(october.receitas).toBe(5000);
    expect(october.despesas).toBe(0);
    expect(october.projected).toBe(false);
  });

  it('marks months with recurring PLANNED transactions as projected: true', () => {
    const paidSept = createMockTransaction({
      id: 'tx-sept',
      competenceDate: '2026-09-10',
      amount: 5000,
      type: TransactionType.INCOME,
      status: TransactionStatus.PAID,
      isRecurring: true,
    });

    const plannedOct = createMockTransaction({
      id: 'tx-oct',
      competenceDate: '2026-10-10',
      amount: 5000,
      type: TransactionType.INCOME,
      status: TransactionStatus.PLANNED,
      isRecurring: true,
    });

    const result = aggregateTransactionsByMonth([paidSept, plannedOct], '2026-10', 'user-1', false);

    const september = result[4];
    expect(september.receitas).toBe(5000);
    expect(september.projected).toBe(false);

    const october = result[5];
    expect(october.receitas).toBe(5000);
    expect(october.projected).toBe(true);
  });

  it('marks months as not projected when all transactions are PAID, even if recurring', () => {
    const paidOct = createMockTransaction({
      competenceDate: '2026-10-05',
      amount: 2500,
      type: TransactionType.EXPENSE,
      status: TransactionStatus.PAID,
      isRecurring: true,
    });

    const result = aggregateTransactionsByMonth([paidOct], '2026-10', 'user-1', false);

    const october = result[5];
    expect(october.despesas).toBe(2500);
    expect(october.projected).toBe(false);
  });

  it('correctly aggregates couple context transactions between user and partner', () => {
    const userIncome = createMockTransaction({
      id: 'tx-user',
      userId: 'user-1',
      competenceDate: '2026-10-01',
      amount: 4000,
      type: TransactionType.INCOME,
      status: TransactionStatus.PAID,
    });

    const partnerIncome = createMockTransaction({
      id: 'tx-partner',
      userId: 'partner-2',
      competenceDate: '2026-10-05',
      amount: 3000,
      type: TransactionType.INCOME,
      status: TransactionStatus.PAID,
    });

    const result = aggregateTransactionsByMonth([userIncome, partnerIncome], '2026-10', 'user-1', true);

    const october = result[5];
    expect(october.receitas).toBe(7000);
    expect(october.userRevenue).toBe(4000);
    expect(october.partnerRevenue).toBe(3000);
    expect(october.projected).toBe(false);
  });
});
