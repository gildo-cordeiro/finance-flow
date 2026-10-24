export type AccountType = 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD';

export type BankAccountType = Exclude<AccountType, 'CREDIT_CARD'>;

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  bank: string | null;
  initialBalance: number;
  competenceOffset: number;
  archived: boolean;
  balance: number;
}

export interface AccountsSummary {
  balance: number;
  accountCount: number;
}

export interface SaveAccountRequest {
  name: string;
  type: BankAccountType;
  bank: string | null;
  initialBalance: number;
  competenceOffset: number;
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CHECKING: 'Conta corrente',
  SAVINGS: 'Poupança',
  CREDIT_CARD: 'Cartão de crédito',
};
