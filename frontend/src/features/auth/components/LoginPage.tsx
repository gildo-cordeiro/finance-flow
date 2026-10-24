import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { errorMessage } from '@/services/errors';
import { applyFieldErrors } from '@/lib/forms';
import { useAuth } from '../hooks/useAuth';
import { loginSchema, type LoginForm } from '../schemas/authSchemas';
import { AuthCard } from './AuthCard';
import { PasswordInput } from './PasswordInput';

export function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const { isSubmitting } = form.formState;

  // Com a sessão aberta, o PublicOnlyRoute leva o usuário à rota que ele tentou abrir
  const onSubmit = form.handleSubmit(async (data) => {
    setError(null);
    try {
      await login(data);
    } catch (err) {
      applyFieldErrors(err, form.setError, { email: 'email', password: 'password' });
      setError(errorMessage(err));
    }
  });

  return (
    <AuthCard
      title="Entrar no FinanceFlow"
      subtitle="Suas finanças pessoais e do casal em um só lugar"
      error={error}
      footer={
        <span>
          Não tem uma conta?{' '}
          <Link to="/cadastrar" state={location.state} className="font-medium text-primary hover:underline">
            Cadastre-se
          </Link>
        </span>
      }
    >
      <Form {...form}>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" placeholder="voce@exemplo.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="current-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <LoaderCircle className="animate-spin" />}
            Entrar
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
