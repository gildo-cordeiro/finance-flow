export type BudgetCategoryType = 'INCOME' | 'EXPENSE';

export interface BudgetLine {
  categoryId: string;
  name: string;
  type: BudgetCategoryType;
  archived: boolean;
  /** Valor planejado direto nesta categoria. */
  directPlanned: number | null;
  /** Na categoria mãe, o direto mais o das subcategorias. Nulo quando nada foi planejado. */
  planned: number | null;
  realized: number;
  realizedPaid: number;
  remaining: number | null;
  percentUsed: number | null;
  children: BudgetLine[];
}

export interface BudgetTotals {
  planned: number;
  realized: number;
  realizedPaid: number;
  remaining: number;
  percentUsed: number | null;
}

export interface Budget {
  month: string;
  categories: BudgetLine[];
  totals: { income: BudgetTotals; expense: BudgetTotals };
  previousMonthPlanned: number;
}
