import { request } from '@/services/http';
import type {
  Card,
  CategoryOption,
  Invoice,
  InvoiceDetail,
  InvoicePayment,
  InvoicePreview,
  PayInvoiceRequest,
  PaymentAccountOption,
  PurchaseRequest,
  SaveCardRequest,
} from '../types';

export const cardsApi = {
  list: (includeArchived: boolean) => request<Card[]>(`/cards?includeArchived=${includeArchived}`),

  create: (data: SaveCardRequest) => request<Card>('/cards', { method: 'POST', body: data }),

  update: (id: string, data: SaveCardRequest) => request<Card>(`/cards/${id}`, { method: 'PUT', body: data }),

  archive: (id: string) => request<Card>(`/cards/${id}/archive`, { method: 'POST' }),

  unarchive: (id: string) => request<Card>(`/cards/${id}/unarchive`, { method: 'POST' }),

  remove: (id: string) => request<void>(`/cards/${id}`, { method: 'DELETE' }),

  invoices: (cardId: string) => request<Invoice[]>(`/cards/${cardId}/invoices`),

  currentInvoice: (cardId: string) => request<Invoice>(`/cards/${cardId}/invoices/current`),

  invoice: (id: string) => request<InvoiceDetail>(`/invoices/${id}`),

  preview: (cardId: string, purchaseDate: string) =>
    request<InvoicePreview>(`/cards/${cardId}/invoices/preview?purchaseDate=${purchaseDate}`),

  purchase: (cardId: string, data: PurchaseRequest) =>
    request<unknown>(`/cards/${cardId}/purchases`, { method: 'POST', body: data }),

  deletePurchase: (itemId: string) => request<void>(`/card-purchases/${itemId}`, { method: 'DELETE' }),

  pay: (invoiceId: string, data: PayInvoiceRequest) =>
    request<InvoicePayment>(`/invoices/${invoiceId}/payments`, { method: 'POST', body: data }),

  reversePayment: (invoiceId: string, paymentId: string) =>
    request<void>(`/invoices/${invoiceId}/payments/${paymentId}`, { method: 'DELETE' }),

  paymentAccounts: () => request<PaymentAccountOption[]>('/accounts?includeArchived=false'),

  expenseCategories: () => request<CategoryOption[]>('/categories?type=EXPENSE&includeArchived=false'),
};
