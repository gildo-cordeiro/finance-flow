import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { User, Lock, Mail, Globe, DollarSign, Calendar, AlertTriangle } from 'lucide-react';
import type { ApiError } from '../types';

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

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [timeZone, setTimeZone] = useState('America/Sao_Paulo');
  const [currency, setCurrency] = useState('BRL');
  const [budgetClosingDay, setBudgetClosingDay] = useState(1);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !timeZone || !currency || !budgetClosingDay) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await register({
        name,
        email,
        password,
        timeZone,
        currency,
        budgetClosingDay: Number(budgetClosingDay)
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Falha ao registrar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
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

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-5 h-5 text-zinc-500" />
                    <input
                      type="text"
                      required
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl py-2.5 pl-11 pr-4 text-white text-sm outline-none transition-all placeholder:text-zinc-600"
                      placeholder="Gildo Duarte"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-5 h-5 text-zinc-500" />
                    <input
                      type="email"
                      required
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl py-2.5 pl-11 pr-4 text-white text-sm outline-none transition-all placeholder:text-zinc-600"
                      placeholder="seu-email@dominio.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-5 h-5 text-zinc-500" />
                    <input
                      type="password"
                      required
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl py-2.5 pl-11 pr-4 text-white text-sm outline-none transition-all placeholder:text-zinc-600"
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Moeda</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3.5 top-3 w-5 h-5 text-zinc-500" />
                    <select
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl py-2.5 pl-11 pr-4 text-white text-sm outline-none transition-all appearance-none cursor-pointer"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      disabled={isLoading}
                    >
                      {CURRENCIES.map(c => (
                        <option key={c.value} value={c.value} className="bg-zinc-900">{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Fuso Horário</label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-3 w-5 h-5 text-zinc-500" />
                    <select
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl py-2.5 pl-11 pr-4 text-white text-sm outline-none transition-all appearance-none cursor-pointer"
                      value={timeZone}
                      onChange={(e) => setTimeZone(e.target.value)}
                      disabled={isLoading}
                    >
                      {TIMEZONES.map(t => (
                        <option key={t.value} value={t.value} className="bg-zinc-900">{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Dia de Fechamento do Orçamento</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3 w-5 h-5 text-zinc-500" />
                    <input
                      type="number"
                      required
                      min="1"
                      max="31"
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl py-2.5 pl-11 pr-4 text-white text-sm outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="Ex: 1"
                      value={budgetClosingDay}
                      onChange={(e) => setBudgetClosingDay(Number(e.target.value))}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-medium rounded-xl py-2.5 shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Registrar Conta'
                )}
              </button>
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
