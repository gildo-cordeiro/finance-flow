import { z } from 'zod';
import type { SaveTransactionRequest, Transaction } from '../types';

export const transactionSchema = z
  .object({
    type: z.enum(['EXPENSE', 'INCOME']),
    amount: z.number().positive('Informe um valor maior que zero'),
    description: z.string().trim().min(1, 'Informe a descrição').max(255, 'Use no máximo 255 caracteres'),
    accountId: z.string().min(1, 'Escolha a conta'),
    categoryId: z.string().min(1, 'Escolha a categoria'),
    dueDate: z.string().min(1, 'Informe a data'),
    paid: z.boolean(),
    paymentDate: z.string(),
    planned: z.boolean(),
    // Vazio = usar a competência sugerida pelo backend
    competenceMonth: z.string(),
  })
  .refine((values) => !values.paid || values.paymentDate !== '', {
    path: ['paymentDate'],
    message: 'Informe a data de pagamento',
  });

export type TransactionForm = z.infer<typeof transactionSchema>;

export function formDefaults(today: string, transaction?: Transaction): TransactionForm {
  if (!transaction) {
    return {
      type: 'EXPENSE',
      amount: 0,
      description: '',
      accountId: '',
      categoryId: '',
      dueDate: today,
      paid: false,
      paymentDate: today,
      planned: false,
      competenceMonth: '',
    };
  }
  return {
    type: transaction.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
    amount: transaction.amount,
    description: transaction.description,
    accountId: transaction.accountId,
    categoryId: transaction.categoryId ?? '',
    dueDate: transaction.dueDate ?? transaction.paymentDate ?? today,
    paid: transaction.status === 'PAID',
    paymentDate: transaction.paymentDate ?? today,
    planned: transaction.status === 'PLANNED',
    // Competência sugerida volta a ser sugerida se o vencimento mudar (ADR-0038)
    competenceMonth: transaction.competenceInformed ? transaction.competenceMonth : '',
  };
}

export function toTransactionRequest(values: TransactionForm): SaveTransactionRequest {
  return {
    type: values.type,
    description: values.description,
    amount: values.amount,
    accountId: values.accountId,
    categoryId: values.categoryId,
    competenceMonth: values.competenceMonth || null,
    dueDate: values.dueDate,
    paymentDate: values.paid ? values.paymentDate : null,
    status: values.paid ? 'PAID' : values.planned ? 'PLANNED' : null,
  };
}
