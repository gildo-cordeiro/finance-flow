export interface Category {
  id: string;
  userId?: string | null;
  name: string;
  parentId?: string | null;
}

export interface CategoryPayload {
  name: string;
  parentId?: string | null;
}

export type TransactionType = 'INCOME' | 'EXPENSE';
export type TransactionStatus = 'PLANNED' | 'PAID' | 'PENDING' | 'OVERDUE';
export type TransactionVisibility = 'PERSONAL' | 'SHARED';

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  categoryId: string;
  description: string;
  amount: number;
  type: TransactionType;
  competenceDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  paymentDate?: string | null; // YYYY-MM-DD
  status: TransactionStatus;
  visibility: TransactionVisibility;
  installmentGroupId?: string | null;
  installmentNumber?: number | null;
  totalInstallments?: number | null;
  isRecurring: boolean;
  recurrenceRule?: string | null;
  recurrenceGroupId?: string | null;
}

export interface TransactionPayload {
  accountId: string;
  categoryId: string;
  description: string;
  amount: number;
  type: TransactionType;
  competenceDate?: string | null; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  paymentDate?: string | null; // YYYY-MM-DD
  status: TransactionStatus;
  visibility: TransactionVisibility;
  totalInstallments?: number | null;
  isRecurring?: boolean | null;
  recurrenceRule?: string | null;
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  accountId?: string;
}
