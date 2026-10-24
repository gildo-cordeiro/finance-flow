import { z } from 'zod';
import { formatCurrency } from '@/utils/formatters';
import type { Card, PayInvoiceRequest, PurchaseRequest, SaveCardRequest } from '../types';

const day = z.string().regex(/^([1-9]|[12]\d|3[01])$/, 'Use um dia de 1 a 31');

export const cardSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do cartão').max(100, 'Use no máximo 100 caracteres'),
  brand: z.string().trim().max(30, 'Use no máximo 30 caracteres'),
  creditLimit: z.number().min(0, 'O limite não pode ser negativo'),
  closingDay: day,
  dueDay: day,
  competenceOffset: z.string().regex(/^(\d|1[0-2])$/, 'Use de 0 a 12 meses'),
  defaultPaymentAccountId: z.string(),
});

export type CardForm = z.infer<typeof cardSchema>;

export function cardDefaults(card?: Card): CardForm {
  return {
    name: card?.name ?? '',
    brand: card?.brand ?? '',
    creditLimit: card?.creditLimit ?? 0,
    closingDay: card ? String(card.closingDay) : '',
    dueDay: card ? String(card.dueDay) : '',
    // ADR-0008: padrão 1, a fatura é paga com a renda do mês anterior ao vencimento
    competenceOffset: String(card?.competenceOffset ?? 1),
    defaultPaymentAccountId: card?.defaultPaymentAccountId ?? '',
  };
}

export function toCardRequest(values: CardForm): SaveCardRequest {
  return {
    name: values.name,
    brand: values.brand || null,
    creditLimit: values.creditLimit,
    closingDay: Number(values.closingDay),
    dueDay: Number(values.dueDay),
    competenceOffset: Number(values.competenceOffset),
    defaultPaymentAccountId: values.defaultPaymentAccountId || null,
  };
}

export const MAX_INSTALLMENTS = 48;

export const purchaseSchema = z.object({
  amount: z.number().positive('Informe um valor maior que zero'),
  description: z.string().trim().min(1, 'Informe a descrição').max(255, 'Use no máximo 255 caracteres'),
  categoryId: z.string().min(1, 'Escolha a categoria'),
  purchaseDate: z.string().min(1, 'Informe a data da compra'),
  installments: z.string().regex(/^\d+$/, 'Informe o número de parcelas').refine(
    (value) => Number(value) >= 1 && Number(value) <= MAX_INSTALLMENTS,
    `Use de 1 a ${MAX_INSTALLMENTS} parcelas`
  ),
});

export type PurchaseForm = z.infer<typeof purchaseSchema>;

export function toPurchaseRequest(values: PurchaseForm): PurchaseRequest {
  return {
    description: values.description,
    amount: values.amount,
    categoryId: values.categoryId,
    purchaseDate: values.purchaseDate,
    installments: Number(values.installments),
  };
}

/** O valor não passa do saldo em aberto da fatura (ADR-0039). */
export function paymentSchema(openAmount: number) {
  return z.object({
    fromAccountId: z.string().min(1, 'Escolha a conta pagadora'),
    amount: z
      .number()
      .positive('Informe um valor maior que zero')
      .max(openAmount, `O valor passa do saldo em aberto (${formatCurrency(openAmount)})`),
    paymentDate: z.string().min(1, 'Informe a data do pagamento'),
  });
}

export type PaymentForm = z.infer<ReturnType<typeof paymentSchema>>;

export function toPayInvoiceRequest(values: PaymentForm): PayInvoiceRequest {
  return { fromAccountId: values.fromAccountId, amount: values.amount, paymentDate: values.paymentDate };
}
