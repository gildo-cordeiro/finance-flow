export type AccountType = 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD';
export type AccountStatus = 'ACTIVE' | 'ARCHIVED' | 'CLOSED';

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
  status: AccountStatus;
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

export interface UpdateAccountPayload {
  name: string;
  bank: string;
  balance?: number | null;
  creditLimit?: number | null;
  closingDay?: number | null;
  dueDay?: number | null;
}
