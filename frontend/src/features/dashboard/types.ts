export interface Flow {
  realized: number;
  paid: number;
  pending: number;
}

export interface AccountBalance {
  id: string;
  name: string;
  savings: boolean;
  balance: number;
}

export interface Payable {
  id: string;
  description: string;
  amount: number;
  accountName: string;
  categoryName: string | null;
  dueDate: string;
  overdue: boolean;
}

export interface BudgetCategoryUsage {
  categoryId: string;
  name: string;
  planned: number | null;
  realized: number;
  percentUsed: number | null;
}

export interface DashboardSummary {
  month: string;
  income: Flow;
  expense: Flow;
  balance: number;
  accountsBalance: number;
  accounts: AccountBalance[];
  payables: { items: Payable[]; overdueCount: number };
  budget: { planned: number; realized: number; percentUsed: number | null; topCategories: BudgetCategoryUsage[] };
}
