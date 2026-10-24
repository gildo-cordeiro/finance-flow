import type { TransactionStatus } from '@/components/ui/Badge';

export type { TransactionStatus };

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export type EntryType = Exclude<TransactionType, 'TRANSFER'>;

export type DateField = 'COMPETENCE' | 'DUE' | 'PAYMENT';

export type Visibility = 'PRIVATE' | 'VISIBLE' | 'SHARED';

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  accountId: string;
  accountName: string;
  categoryId: string | null;
  categoryName: string | null;
  parentCategoryName: string | null;
  competenceMonth: string;
  competenceInformed: boolean;
  dueDate: string | null;
  paymentDate: string | null;
  purchaseDate: string | null;
  invoiceId: string | null;
  status: TransactionStatus;
  visibility: Visibility;
  installmentNumber: number | null;
  totalInstallments: number | null;
  transferGroupId: string | null;
  transferDirection: 'IN' | 'OUT' | null;
  recurring: boolean;
}

export interface TransactionTotals {
  count: number;
  income: number;
  expense: number;
  balance: number;
}

export interface TransactionPage {
  items: Transaction[];
  page: number;
  size: number;
  totals: TransactionTotals;
}

export interface TransactionFilters {
  month: string;
  dateField: DateField;
  type: TransactionType | null;
  accountId: string | null;
  categoryId: string | null;
  status: TransactionStatus | null;
  q: string;
}

export interface SaveTransactionRequest {
  type: EntryType;
  description: string;
  amount: number;
  accountId: string;
  categoryId: string;
  competenceMonth: string | null;
  dueDate: string | null;
  paymentDate: string | null;
  status: TransactionStatus | null;
}

export interface AccountOption {
  id: string;
  name: string;
  type: 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD';
  archived: boolean;
}

export interface CategoryOption {
  id: string;
  name: string;
  type: EntryType;
  parentId: string | null;
  archived: boolean;
  subcategories: CategoryOption[];
}

export const DATE_FIELD_LABELS: Record<DateField, string> = {
  COMPETENCE: 'Competência',
  DUE: 'Vencimento',
  PAYMENT: 'Pagamento',
};

export const STATUS_LABELS: Record<TransactionStatus, string> = {
  PLANNED: 'Planejado',
  PENDING: 'Pendente',
  PAID: 'Pago',
  OVERDUE: 'Atrasado',
};
