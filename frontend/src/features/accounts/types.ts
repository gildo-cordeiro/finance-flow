export type AccountType = 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD';

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  bank: string;
  balance: number;
  creditLimit?: number | null;
  closingDay?: number | null;
  dueDay?: number | null;
  associatedAccountId?: string | null;
}

export interface AccountPayload {
  name: string;
  type: AccountType;
  bank: string;
  balance: number;
  creditLimit?: number | null;
  closingDay?: number | null;
  dueDay?: number | null;
  associatedAccountId?: string | null;
}
