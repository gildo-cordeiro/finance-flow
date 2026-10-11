import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { CashFlowChart } from './CashFlowChart';
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

describe('CashFlowChart (UX-10 Visual requirements)', () => {
  it('renders chart component tree with maxBarSize, CartesianGrid, and YAxis configuration', () => {
    const mockData = [
      {
        name: 'Out/26',
        receitas: 5000,
        despesas: 2500,
        userRevenue: 5000,
        userExpenses: 2500,
        partnerRevenue: 0,
        partnerExpenses: 0,
        projected: false,
      },
    ];

    const element = CashFlowChart({
      chartData: mockData,
      isCouple: false,
      partnerName: '',
    });

    expect(element).toBeDefined();

    const [, chartContainer] = element.props.children;
    const responsiveContainer = chartContainer.props.children;
    const barChart = responsiveContainer.props.children;

    expect(barChart.props.maxBarSize).toBe(24);
    expect(barChart.props.data).toEqual(mockData);

    interface ElementProps {
      stroke?: string;
      vertical?: boolean;
      fontSize?: number;
      tick?: { fill?: string };
      dataKey?: string;
      maxBarSize?: number;
      fill?: string;
      radius?: number[];
    }

    const isReactElementWithProps = (child: unknown): child is ReactElement<ElementProps> =>
      Boolean(child && typeof child === 'object' && 'props' in child);

    const chartChildren = (barChart.props.children as unknown[]).filter(isReactElementWithProps);

    // Verify CartesianGrid with horizontal lines in #2A2E45
    const cartesianGrid = chartChildren.find((child) => child.props.stroke === '#2A2E45');
    expect(cartesianGrid).toBeDefined();
    expect(cartesianGrid?.props.stroke).toBe('#2A2E45');
    expect(cartesianGrid?.props.vertical).toBe(false);

    // Verify YAxis with 12px and text-text-muted (#9AA0B4)
    const yAxis = chartChildren.find((child) => child.props.stroke === '#9AA0B4');
    expect(yAxis).toBeDefined();
    expect(yAxis?.props.fontSize).toBe(12);
    expect(yAxis?.props.stroke).toBe('#9AA0B4');
    expect(yAxis?.props.tick).toEqual({ fill: '#9AA0B4' });

    // Verify Bars: maxBarSize={24}, radius=[4,4,0,0], colors #22C55E and #EF4444
    const bars = chartChildren.filter(
      (child) => child.props.dataKey === 'receitas' || child.props.dataKey === 'despesas'
    );
    expect(bars).toHaveLength(2);

    const [receitasBar, despesasBar] = bars;
    expect(receitasBar.props.dataKey).toBe('receitas');
    expect(receitasBar.props.maxBarSize).toBe(24);
    expect(receitasBar.props.fill).toBe('#22C55E');
    expect(receitasBar.props.radius).toEqual([4, 4, 0, 0]);

    expect(despesasBar.props.dataKey).toBe('despesas');
    expect(despesasBar.props.maxBarSize).toBe(24);
    expect(despesasBar.props.fill).toBe('#EF4444');
    expect(despesasBar.props.radius).toEqual([4, 4, 0, 0]);
  });

  it('renders empty state message when chartData is empty', () => {
    const element = CashFlowChart({
      chartData: [],
      isCouple: false,
      partnerName: '',
    });

    const [, chartContainer] = element.props.children;
    const emptyState = chartContainer.props.children;
    expect(emptyState.props.children).toBe('Nenhum dado de fluxo de caixa disponível.');
  });
});

