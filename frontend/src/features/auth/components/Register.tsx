import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { User, Lock, Mail, Globe, DollarSign, Calendar, AlertTriangle } from 'lucide-react';
import type { ApiError } from '../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';

const TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'Brasília (GMT-3)' },
  { value: 'UTC', label: 'UTC (GMT+0)' },
  { value: 'America/New_York', label: 'New York (GMT-5)' },
  { value: 'Europe/London', label: 'London (GMT+0)' },
  { value: 'Europe/Paris', label: 'Paris (GMT+1)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (GMT+9)' }
];

const CURRENCIES = [
  { value: 'BRL', label: 'Real (R$)' },
  { value: 'USD', label: 'Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'Pound (£)' }
];

const registerSchema = z.object({
  name: z.string().min(1, 'O nome completo é obrigatório'),
  email: z.string().min(1, 'O e-mail é obrigatório').email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve conter no mínimo 6 caracteres'),
  currency: z.string().min(1, 'A moeda é obrigatória'),
  timeZone: z.string().min(1, 'O fuso horário é obrigatório'),
  budgetClosingDay: z.coerce.number().min(1, 'Dia de fechamento inválido (mínimo 1)').max(31, 'Dia de fechamento inválido (máximo 31)'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(registerSchema) as any,
    defaultValues: {
      name: '',
      email: '',
      password: '',
      currency: 'BRL',
      timeZone: 'America/Sao_Paulo',
      budgetClosingDay: 1,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    try {
      await registerUser(data);
      setSuccess(true);
      const redirectTo = searchParams.get('redirectTo');
      setTimeout(() => {
        navigate(redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : '/login');
      }, 2000);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Falha ao registrar conta. Tente novamente.');
    }
  };

  return (
    <div className="gradient-bg min-h-screen flex items-center justify-center p-4">
      <div className="auth-card w-full max-w-xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30 mb-3">
            <span className="text-xl font-bold text-white tracking-wider">FF</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Criar sua conta</h2>
          <p className="text-sm text-zinc-400 mt-1">Cadastre seus dados e configurações iniciais</p>
        </div>

        {success ? (
          <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
            <h3 className="text-lg font-semibold text-emerald-400">Conta registrada com sucesso!</h3>
            <p className="text-zinc-400 text-sm">Redirecionando para a tela de login...</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  type="text"
                  label="Nome Completo"
                  placeholder="Gildo Duarte"
                  error={errors.name?.message}
                  disabled={isSubmitting}
                  leftIcon={<User className="w-5 h-5" />}
                  {...register('name')}
                />

                <Input
                  type="email"
                  label="E-mail"
                  placeholder="seu-email@dominio.com"
                  error={errors.email?.message}
                  disabled={isSubmitting}
                  leftIcon={<Mail className="w-5 h-5" />}
                  {...register('email')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  type="password"
                  label="Senha"
                  placeholder="Mínimo 6 caracteres"
                  error={errors.password?.message}
                  disabled={isSubmitting}
                  leftIcon={<Lock className="w-5 h-5" />}
                  {...register('password')}
                />

                <Select
                  label="Moeda"
                  error={errors.currency?.message}
                  disabled={isSubmitting}
                  leftIcon={<DollarSign className="w-5 h-5" />}
                  {...register('currency')}
                >
                  {CURRENCIES.map(c => (
                    <option key={c.value} value={c.value} className="bg-zinc-900">{c.label}</option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Select
                  label="Fuso Horário"
                  error={errors.timeZone?.message}
                  disabled={isSubmitting}
                  leftIcon={<Globe className="w-5 h-5" />}
                  {...register('timeZone')}
                >
                  {TIMEZONES.map(t => (
                    <option key={t.value} value={t.value} className="bg-zinc-900">{t.label}</option>
                  ))}
                </Select>

                <Input
                  type="number"
                  label="Fechamento do Orçamento (Dia)"
                  placeholder="Ex: 1"
                  min="1"
                  max="31"
                  error={errors.budgetClosingDay?.message}
                  disabled={isSubmitting}
                  leftIcon={<Calendar className="w-5 h-5" />}
                  {...register('budgetClosingDay')}
                />
              </div>

              <Button
                type="submit"
                loading={isSubmitting}
                className="w-full mt-2"
              >
                Registrar Conta
              </Button>
            </form>

            <div className="mt-8 text-center text-sm text-zinc-500">
              Já possui conta?{' '}
              <Link to="/login" className="text-violet-400 hover:text-violet-300 transition-colors font-medium">
                Faça Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
