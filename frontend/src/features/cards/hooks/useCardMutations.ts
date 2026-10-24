import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cardsApi } from '../api/cardsApi';
import type { PayInvoiceRequest, PurchaseRequest, SaveCardRequest } from '../types';
import { CARDS_KEY, INVOICES_KEY } from './useCards';

function useInvalidateCards() {
  const queryClient = useQueryClient();
  return () => Promise.all([CARDS_KEY, ['accounts']].map((queryKey) => queryClient.invalidateQueries({ queryKey })));
}

// Uma compra ou um pagamento muda a fatura, o limite, os saldos, as transações, o orçamento e o painel
function useInvalidatePurchases() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all(
      [INVOICES_KEY, CARDS_KEY, ['accounts'], ['transactions'], ['budgets'], ['dashboard']].map((queryKey) =>
        queryClient.invalidateQueries({ queryKey })
      )
    );
}

export function useSaveCard() {
  const onSuccess = useInvalidateCards();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: SaveCardRequest }) =>
      id ? cardsApi.update(id, data) : cardsApi.create(data),
    onSuccess,
  });
}

export function useSetCardArchived() {
  const onSuccess = useInvalidateCards();
  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      archived ? cardsApi.archive(id) : cardsApi.unarchive(id),
    onSuccess,
  });
}

export function useDeleteCard() {
  const onSuccess = useInvalidateCards();
  return useMutation({ mutationFn: cardsApi.remove, onSuccess });
}

export function usePurchase() {
  const onSuccess = useInvalidatePurchases();
  return useMutation({
    mutationFn: ({ cardId, data }: { cardId: string; data: PurchaseRequest }) => cardsApi.purchase(cardId, data),
    onSuccess,
  });
}

export function useDeletePurchase() {
  const onSuccess = useInvalidatePurchases();
  return useMutation({ mutationFn: cardsApi.deletePurchase, onSuccess });
}

export function usePayInvoice() {
  const onSuccess = useInvalidatePurchases();
  return useMutation({
    mutationFn: ({ invoiceId, data }: { invoiceId: string; data: PayInvoiceRequest }) => cardsApi.pay(invoiceId, data),
    onSuccess,
  });
}

export function useReversePayment() {
  const onSuccess = useInvalidatePurchases();
  return useMutation({
    mutationFn: ({ invoiceId, paymentId }: { invoiceId: string; paymentId: string }) =>
      cardsApi.reversePayment(invoiceId, paymentId),
    onSuccess,
  });
}
