import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Lock, Mail, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import type { ApiError } from '../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

const loginSchema = z.object({
  email: z.string().min(1, 'O e-mail é obrigatório').email('E-mail inválido'),
  password: z.string().min(1, 'A senha é obrigatória'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    try {
      await login(data);
      navigate('/');
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Falha ao realizar login. Verifique suas credenciais.');
    }
  };

  return (
    <div className="gradient-bg min-h-screen flex items-center justify-center p-4">
      <div className="auth-card w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30 mb-3">
            <span className="text-xl font-bold text-white tracking-wider">FF</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Entrar no FinanceFlow</h2>
          <p className="text-sm text-zinc-400 mt-1">Gerencie suas finanças individuais e de casal</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            type="email"
            label="E-mail"
            placeholder="seu-email@dominio.com"
            error={errors.email?.message}
            disabled={isSubmitting}
            leftIcon={<Mail className="w-5 h-5" />}
            {...register('email')}
          />

          <Input
            type={showPassword ? 'text' : 'password'}
            label="Senha"
            placeholder="••••••••"
            error={errors.password?.message}
            disabled={isSubmitting}
            leftIcon={<Lock className="w-5 h-5" />}
            rightIcon={
              <button
                type="button"
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            }
            {...register('password')}
          />

          <Button
            type="submit"
            loading={isSubmitting}
            className="w-full mt-2"
          >
            Entrar
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-zinc-500">
          Não tem uma conta?{' '}
          <Link to="/register" className="text-violet-400 hover:text-violet-300 transition-colors font-medium">
            Cadastre-se
          </Link>
        </div>
      </div>
    </div>
  );
}
