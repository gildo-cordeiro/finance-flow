import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { applyFieldErrors } from '@/lib/forms';
import { ApiError, errorMessage } from '@/services/errors';
import { useResetPassword } from '../hooks/usePasswordReset';
import { resetPasswordSchema, type ResetPasswordForm } from '../schemas/authSchemas';
import { AuthCard } from './AuthCard';
import { PasswordInput } from './PasswordInput';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const resetPassword = useResetPassword();
  const [linkInvalid, setLinkInvalid] = useState(!token);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmation: '' },
  });

  const onSubmit = form.handleSubmit(async ({ password }) => {
    if (!token) return;
    setError(null);
    try {
      await resetPassword.mutateAsync({ token, newPassword: password });
      toast.success('Senha alterada. Entre com a senha nova.');
      navigate('/entrar', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'INVALID_RESET_TOKEN') {
        setLinkInvalid(true);
        return;
      }
      const marked = applyFieldErrors(err, form.setError, { newPassword: 'password' });
      setError(marked ? null : errorMessage(err));
    }
  });

  if (linkInvalid) {
    return (
      <AuthCard
        title="Este link não vale mais"
        subtitle="Links de redefinição valem por 1 hora e funcionam uma vez"
        footer={
          <Link to="/entrar" className="font-medium text-primary hover:underline">
            Voltar para o login
          </Link>
        }
      >
        <Button asChild className="w-full">
          <Link to="/esqueci-senha">Pedir outro link</Link>
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Criar senha nova"
      subtitle="Depois de salvar, você sai de todos os aparelhos e entra de novo com a senha nova"
      error={error}
      footer={
        <Link to="/entrar" className="font-medium text-primary hover:underline">
          Voltar para o login
        </Link>
      }
    >
      <Form {...form}>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha nova</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="new-password" {...field} />
                </FormControl>
                <FormDescription>Ao menos 8 caracteres, com letras e números.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Repita a senha</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={resetPassword.isPending} className="w-full">
            {resetPassword.isPending && <LoaderCircle className="animate-spin" />}
            Salvar senha
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
