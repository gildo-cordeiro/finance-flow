export interface Card {
  id: string;
  name: string;
  brand: string | null;
  creditLimit: number;
  closingDay: number;
  dueDay: number;
  competenceOffset: number;
  defaultPaymentAccountId: string | null;
  archived: boolean;
  /** Faturas não quitadas, atuais e futuras, menos o que já foi pago delas (RF-034). */
  used: number;
  available: number;
}

export interface SaveCardRequest {
  name: string;
  brand: string | null;
  creditLimit: number;
  closingDay: number;
  dueDay: number;
  competenceOffset: number;
  defaultPaymentAccountId: string | null;
}

export type InvoiceStatus = 'OPEN' | 'CLOSED' | 'PAID' | 'PARTIALLY_PAID';

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  OPEN: 'Aberta',
  CLOSED: 'Fechada',
  PAID: 'Paga',
  PARTIALLY_PAID: 'Paga em parte',
};

/** Sem `id`, é a fatura atual que ainda não tem compras. */
export interface Invoice {
  id: string | null;
  cardId: string;
  closingDate: string;
  dueDate: string;
  competenceMonth: string;
  status: InvoiceStatus;
  total: number;
  paidAmount: number;
  openAmount: number;
  itemCount: number;
}

export interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
  categoryId: string | null;
  categoryName: string | null;
  parentCategoryName: string | null;
  purchaseDate: string;
  installmentNumber: number | null;
  totalInstallments: number | null;
  paid: boolean;
  recurring: boolean;
}

export interface InvoicePayment {
  id: string;
  fromAccountId: string;
  fromAccountName: string | null;
  amount: number;
  paymentDate: string;
}

export interface InvoiceDetail {
  invoice: Invoice;
  cardName: string;
  items: InvoiceItem[];
  payments: InvoicePayment[];
  previousInvoiceId: string | null;
  nextInvoiceId: string | null;
}

export interface InvoicePreview {
  closingDate: string;
  dueDate: string;
  competenceMonth: string;
}

export interface PurchaseRequest {
  description: string;
  amount: number;
  categoryId: string;
  purchaseDate: string;
  installments: number;
}

export interface PayInvoiceRequest {
  fromAccountId: string;
  amount: number;
  paymentDate: string;
}

export interface PaymentAccountOption {
  id: string;
  name: string;
  type: 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD';
  archived: boolean;
}

export interface CategoryOption {
  id: string;
  name: string;
  subcategories: { id: string; name: string }[];
}
