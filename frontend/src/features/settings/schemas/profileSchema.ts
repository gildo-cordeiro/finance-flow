import { z } from 'zod';

export const profileSchema = z.object({
  name: z.string().trim().min(1, 'Informe seu nome').max(120, 'Use no máximo 120 caracteres'),
  timezone: z.string().min(1, 'Escolha o fuso horário'),
});

export type ProfileForm = z.infer<typeof profileSchema>;
