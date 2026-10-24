import { z } from 'zod';

export const categoryNameSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome').max(100, 'Use no máximo 100 caracteres'),
});

export type CategoryNameForm = z.infer<typeof categoryNameSchema>;

export const mergeCategorySchema = z.object({
  targetId: z.string().min(1, 'Escolha a categoria de destino'),
});

export type MergeCategoryForm = z.infer<typeof mergeCategorySchema>;
