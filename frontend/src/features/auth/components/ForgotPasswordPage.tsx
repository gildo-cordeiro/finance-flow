import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { applyFieldErrors } from '@/lib/forms';
import { errorMessage } from '@/services/errors';
import { useForgotPassword } from '../hooks/usePasswordReset';
import { forgotPasswordSchema, type ForgotPasswordForm } from '../schemas/authSchemas';
import { AuthCard } from './AuthCard';

const backToLogin = (
  <Link to="/entrar" className="font-medium text-primary hover:underline">
    Voltar para o login
  </Link>
);

export function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const send = async (email: string) => {
    setError(null);
    try {
      await forgotPassword.mutateAsync({ email });
      setSentTo(email);
    } catch (err) {
      const marked = applyFieldErrors(err, form.setError, { email: 'email' });
      setError(marked ? null : errorMessage(err));
    }
  };

  const onSubmit = form.handleSubmit(({ email }) => send(email));

  // A API responde igual exista ou não o e-mail (RF-004), então a tela também não revela o cadastro
  if (sentTo) {
    return (
      <AuthCard title="Confira seu e-mail" subtitle="O link chega em alguns minutos" error={error} footer={backToLogin}>
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Mail className="h-5 w-5" />
          </span>
          <p className="text-sm text-text-label">
            Se {sentTo} tiver conta, enviamos um link para criar uma senha nova. Ele vale por 1 hora e funciona uma
            vez.
          </p>
          <p className="text-xs text-muted-foreground">
            Não chegou? Veja a caixa de spam ou peça de novo. Um link novo invalida o anterior.
          </p>
          <Button
            variant="outline"
            className="w-full"
            disabled={forgotPassword.isPending}
            onClick={() => send(sentTo)}
          >
            {forgotPassword.isPending && <LoaderCircle className="animate-spin" />}
            Enviar outro link
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Esqueci minha senha"
      subtitle="Informe o e-mail da sua conta para receber um link de redefinição"
      error={error}
      footer={backToLogin}
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
          <Button type="submit" disabled={forgotPassword.isPending} className="w-full">
            {forgotPassword.isPending && <LoaderCircle className="animate-spin" />}
            Enviar link
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
