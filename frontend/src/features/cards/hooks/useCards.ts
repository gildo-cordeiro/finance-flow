import { useQueries, useQuery } from '@tanstack/react-query';
import { cardsApi } from '../api/cardsApi';

export const CARDS_KEY = ['cards'];
export const INVOICES_KEY = ['invoices'];

export function useCards(includeArchived: boolean) {
  return useQuery({ queryKey: [...CARDS_KEY, { includeArchived }], queryFn: () => cardsApi.list(includeArchived) });
}

export function useCard(id: string) {
  return useQuery({
    queryKey: [...CARDS_KEY, { includeArchived: true }],
    queryFn: () => cardsApi.list(true),
    select: (cards) => cards.find((card) => card.id === id),
  });
}

export function useInvoices(cardId: string) {
  return useQuery({ queryKey: [...INVOICES_KEY, cardId, 'list'], queryFn: () => cardsApi.invoices(cardId) });
}

export function useCurrentInvoice(cardId: string) {
  return useQuery({ queryKey: [...INVOICES_KEY, cardId, 'current'], queryFn: () => cardsApi.currentInvoice(cardId) });
}

export function useCurrentInvoices(cardIds: string[]) {
  return useQueries({
    queries: cardIds.map((cardId) => ({
      queryKey: [...INVOICES_KEY, cardId, 'current'],
      queryFn: () => cardsApi.currentInvoice(cardId),
    })),
  });
}

export function useInvoice(id: string | null) {
  return useQuery({
    queryKey: [...INVOICES_KEY, 'detail', id],
    queryFn: () => cardsApi.invoice(id ?? ''),
    enabled: id !== null,
  });
}

export function useInvoicePreview(cardId: string, purchaseDate: string) {
  return useQuery({
    queryKey: [...INVOICES_KEY, cardId, 'preview', purchaseDate],
    queryFn: () => cardsApi.preview(cardId, purchaseDate),
    enabled: cardId !== '' && /^\d{4}-\d{2}-\d{2}$/.test(purchaseDate),
  });
}

// Mesmas chaves das features de contas e transações, para o cache ser um só
export function usePaymentAccounts() {
  return useQuery({
    queryKey: ['accounts', { includeArchived: false }],
    queryFn: cardsApi.paymentAccounts,
    select: (accounts) => accounts.filter((account) => account.type !== 'CREDIT_CARD'),
  });
}

export function useExpenseCategories() {
  return useQuery({
    queryKey: ['categories', { type: 'EXPENSE', includeArchived: false }],
    queryFn: cardsApi.expenseCategories,
  });
}
