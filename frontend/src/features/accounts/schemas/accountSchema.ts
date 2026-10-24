import { z } from 'zod';
import type { SaveAccountRequest } from '../types';

export const accountSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome da conta').max(100, 'Use no máximo 100 caracteres'),
  type: z.enum(['CHECKING', 'SAVINGS']),
  bank: z.string().trim().max(100, 'Use no máximo 100 caracteres'),
  initialBalance: z
    .string()
    .trim()
    .regex(/^-?\d+([.,]\d{1,2})?$/, 'Informe um valor como 1500,00'),
  competenceOffset: z.string().regex(/^(\d|1[0-2])$/, 'Use de 0 a 12 meses'),
});

export type AccountForm = z.infer<typeof accountSchema>;

export function toAccountRequest(values: AccountForm): SaveAccountRequest {
  return {
    name: values.name,
    type: values.type,
    bank: values.bank || null,
    initialBalance: Number(values.initialBalance.replace(',', '.')),
    competenceOffset: Number(values.competenceOffset),
  };
}
