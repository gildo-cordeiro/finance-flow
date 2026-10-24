import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ApiError, errorMessage } from '@/services/errors';
import { applyFieldErrors } from '@/lib/forms';
import { useAuth } from '../hooks/useAuth';
import { usePrivacyPolicy } from '../hooks/usePrivacyPolicy';
import { registerSchema, type RegisterForm } from '../schemas/authSchemas';
import { AuthCard } from './AuthCard';
import { PasswordInput } from './PasswordInput';

const POLICY_UNAVAILABLE = 'Não foi possível carregar a política de privacidade. Recarregue a página para tentar de novo.';

export function RegisterPage() {
  const auth = useAuth();
  const privacyPolicy = usePrivacyPolicy();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', acceptPrivacy: false },
  });
  const { isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async ({ name, email, password }) => {
    const policyVersion = privacyPolicy.data?.version;
    if (!policyVersion) return;
    setError(null);
    try {
      await auth.register({ name, email, password, acceptedPrivacyVersion: policyVersion });
      toast.success('Conta criada. Boas-vindas ao FinanceFlow!');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'EMAIL_ALREADY_USED') {
        form.setError('email', { message: errorMessage(err) });
        return;
      }
      const marked = applyFieldErrors(err, form.setError, {
        name: 'name',
        email: 'email',
        password: 'password',
        acceptedPrivacyVersion: 'acceptPrivacy',
      });
      setError(marked ? null : errorMessage(err));
    }
  });

  return (
    <AuthCard
      title="Criar conta"
      subtitle="Comece a organizar suas finanças em poucos minutos"
      error={privacyPolicy.isError ? POLICY_UNAVAILABLE : error}
      footer={
        <span>
          Já tem uma conta?{' '}
          <Link to="/entrar" state={location.state} className="font-medium text-primary hover:underline">
            Entrar
          </Link>
        </span>
      }
    >
      <Form {...form}>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input autoComplete="name" placeholder="Como você quer ser chamado" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
                  <PasswordInput autoComplete="new-password" {...field} />
                </FormControl>
                <FormDescription>Ao menos 8 caracteres, com letras e números.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="acceptPrivacy"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-start gap-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      className="mt-0.5"
                    />
                  </FormControl>
                  <FormLabel className="font-normal leading-snug text-secondary-foreground">
                    Li e aceito a{' '}
                    <Link
                      to="/privacidade"
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      política de privacidade
                    </Link>
                  </FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isSubmitting || !privacyPolicy.data} className="w-full">
            {isSubmitting && <LoaderCircle className="animate-spin" />}
            Criar conta
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
