import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { User, Globe, DollarSign, Calendar, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import { CoupleSettingsSection } from '../../couple/components/CoupleSettingsSection';
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

export function Profile() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [timeZone, setTimeZone] = useState('America/Sao_Paulo');
  const [currency, setCurrency] = useState('BRL');
  const [budgetClosingDay, setBudgetClosingDay] = useState(1);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setTimeZone(user.timeZone);
      setCurrency(user.currency);
      setBudgetClosingDay(user.budgetClosingDay);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !timeZone || !currency || !budgetClosingDay) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await updateProfile({
        name,
        timeZone,
        currency,
        budgetClosingDay: Number(budgetClosingDay),
        dateFormat: user?.dateFormat || 'dd/MM/yyyy'
      });
      setSuccess('Configurações atualizadas com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Falha ao atualizar configurações.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="gradient-bg min-h-screen text-white">
      <header className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between border-b border-zinc-800/80">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Painel
        </button>
        <span className="text-zinc-500 text-xs">ID: {user?.id}</span>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">Configurações da Conta</h1>
          <p className="text-zinc-400 text-sm mt-1">Gerencie suas preferências de exibição e fechamento de orçamento</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-start gap-3">
            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-card p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-5 h-5 text-zinc-500" />
                <input
                  type="text"
                  required
                  className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl py-2.5 pl-11 pr-4 text-white text-sm outline-none transition-all placeholder:text-zinc-600"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">E-mail (Não Editável)</label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  className="w-full bg-zinc-900/20 border border-zinc-900/40 text-zinc-500 rounded-xl py-2.5 px-4 text-sm cursor-not-allowed"
                  value={user?.email || ''}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  value={budgetClosingDay}
                  onChange={(e) => setBudgetClosingDay(Number(e.target.value))}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-medium rounded-xl py-2.5 px-8 shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Salvar Configurações'
              )}
            </button>
          </div>
        </form>

        <CoupleSettingsSection />
      </main>
    </div>
  );
}
