import { z } from 'zod';
import { parseCurrencyToNumber } from '../../../utils/formatters';
import { TransactionType, TransactionStatus, TransactionVisibility } from '../types';

export enum RepetitionType {
  SINGLE = 'SINGLE',
  INSTALLMENT = 'INSTALLMENT',
  RECURRING = 'RECURRING',
}

export enum RecurrenceRule {
  MONTHLY = 'MONTHLY',
}

export const transactionSchema = z.object({
  type: z.nativeEnum(TransactionType),
  amount: z.preprocess(parseCurrencyToNumber, z.number().positive('O valor deve ser maior que zero')),
  description: z.string().min(1, 'A descrição é obrigatória'),
  accountId: z.string().min(1, 'A conta é obrigatória'),
  categoryId: z.string().min(1, 'A categoria é obrigatória'),
  dueDate: z.string().min(1, 'A data de vencimento é obrigatória'),
  competenceDate: z.string().optional().or(z.literal('')),
  paymentDate: z.string().optional().or(z.literal('')),
  status: z.nativeEnum(TransactionStatus),
  visibility: z.nativeEnum(TransactionVisibility),
  repetitionType: z.nativeEnum(RepetitionType).default(RepetitionType.SINGLE),
  totalInstallments: z.coerce.number().optional().nullable(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: z.nativeEnum(RecurrenceRule).optional().nullable(),
}).refine((data) => {
  if (data.status === TransactionStatus.PAID) {
    return !!data.paymentDate;
  }
  return true;
}, {
  message: 'A data de pagamento é obrigatória quando o status é PAGO',
  path: ['paymentDate'],
}).refine((data) => {
  if (data.repetitionType === RepetitionType.INSTALLMENT) {
    return !!data.totalInstallments && data.totalInstallments > 1;
  }
  return true;
}, {
  message: 'O número de parcelas deve ser maior que 1',
  path: ['totalInstallments'],
});

export type TransactionFormData = z.infer<typeof transactionSchema>;
