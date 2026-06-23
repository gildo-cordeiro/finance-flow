export interface BudgetItem {
  categoryId: string;
  categoryName: string;
  parentCategoryId: string | null;
  plannedAmount: number;
  realizedAmount: number;
}

export interface BudgetResponse {
  month: string;
  items: BudgetItem[];
}

export interface UpdateBudgetPayload {
  plannedAmount: number;
}
