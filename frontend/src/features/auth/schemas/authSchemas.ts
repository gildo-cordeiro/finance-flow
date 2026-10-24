import { z } from 'zod';

const email = z.string().trim().min(1, 'Informe o e-mail').pipe(z.email('E-mail inválido'));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Informe a senha'),
});

// Só o mínimo para orientar quem digita; a política de senha é decidida pelo backend (RF-001)
export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Informe seu nome').max(120, 'Use no máximo 120 caracteres'),
  email,
  password: z.string().min(8, 'A senha precisa ter ao menos 8 caracteres'),
  acceptPrivacy: z.boolean().refine((accepted) => accepted, 'É preciso aceitar a política de privacidade'),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'A senha precisa ter ao menos 8 caracteres'),
    confirmation: z.string().min(1, 'Repita a senha'),
  })
  .refine((data) => data.password === data.confirmation, {
    message: 'As senhas não são iguais',
    path: ['confirmation'],
  });

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
