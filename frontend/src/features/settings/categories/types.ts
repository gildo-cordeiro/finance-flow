export type CategoryType = 'INCOME' | 'EXPENSE';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  parentId: string | null;
  archived: boolean;
  subcategories: Category[];
}

export interface CreateCategoryRequest {
  name: string;
  type: CategoryType;
  parentId: string | null;
}

export const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  EXPENSE: 'Despesas',
  INCOME: 'Receitas',
};
