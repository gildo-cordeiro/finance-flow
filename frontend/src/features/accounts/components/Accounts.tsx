import React, { useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useAccounts } from '../hooks/useAccounts';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, CreditCard, Landmark, PiggyBank, 
  HelpCircle, AlertTriangle, X 
} from 'lucide-react';
import type { AccountType, AccountPayload } from '../types';

export function Accounts() {
  const { user } = useAuth();
  const { accounts, isLoading, error, createAccount, isCreating } = useAccounts();
  const navigate = useNavigate();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [type, setType] = useState<AccountType>('CHECKING');
  const [balance, setBalance] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [closingDay, setClosingDay] = useState('');
  const [dueDay, setDueDay] = useState('');
  
  const [formError, setFormError] = useState<string | null>(null);

  if (!user) return null;

  const resetForm = () => {
    setName('');
    setBank('');
    setType('CHECKING');
    setBalance('');
    setCreditLimit('');
    setClosingDay('');
    setDueDay('');
    setFormError(null);
    setIsFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !bank.trim() || !balance) {
      setFormError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const numBalance = parseFloat(balance);
    if (isNaN(numBalance)) {
      setFormError('Saldo inválido.');
      return;
    }

    const payload: AccountPayload = {
      name,
      type,
      bank,
      balance: numBalance,
    };

    if (type === 'CREDIT_CARD') {
      const numLimit = parseFloat(creditLimit);
      const intClosing = parseInt(closingDay);
      const intDue = parseInt(dueDay);

      if (isNaN(numLimit) || numLimit < 0) {
        setFormError('Limite de crédito inválido.');
        return;
      }
      if (isNaN(intClosing) || intClosing < 1 || intClosing > 31) {
        setFormError('Dia do fechamento deve ser entre 1 e 31.');
        return;
      }
      if (isNaN(intDue) || intDue < 1 || intDue > 31) {
        setFormError('Dia do vencimento deve ser entre 1 e 31.');
        return;
      }

      payload.creditLimit = numLimit;
      payload.closingDay = intClosing;
      payload.dueDay = intDue;
    }

    try {
      await createAccount(payload);
      resetForm();
    } catch (err) {
      const error = err as Error;
      setFormError(error.message || 'Erro ao criar conta.');
    }
  };

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'CHECKING':
        return <Landmark className="w-5 h-5 text-violet-400" />;
      case 'SAVINGS':
        return <PiggyBank className="w-5 h-5 text-emerald-400" />;
      case 'CREDIT_CARD':
        return <CreditCard className="w-5 h-5 text-blue-400" />;
      default:
        return <HelpCircle className="w-5 h-5 text-zinc-400" />;
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: user.currency,
    }).format(val);
  };

  return (
    <div className="gradient-bg min-h-screen text-white">
      {/* Header / Navbar */}
      <nav className="glassmorphism sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/50 transition-all flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Painel</span>
          </button>
          
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg tracking-tight text-white">Minhas Contas</span>
          </div>

          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-medium text-sm rounded-xl px-4 py-2 shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Conta</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 max-w-lg mx-auto text-center space-y-4">
            <AlertTriangle className="w-12 h-12 mx-auto" />
            <h3 className="font-bold text-lg">Erro ao carregar contas</h3>
            <p className="text-sm text-red-400/80">{error.message}</p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Grid of Accounts */}
            {accounts.length === 0 ? (
              <div className="auth-card p-12 text-center max-w-lg mx-auto space-y-6">
                <div className="w-16 h-16 bg-zinc-900/80 rounded-2xl flex items-center justify-center mx-auto border border-zinc-800">
                  <Landmark className="w-8 h-8 text-zinc-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold">Nenhuma conta cadastrada</h3>
                  <p className="text-sm text-zinc-400">Comece adicionando uma conta corrente, poupança ou cartão de crédito.</p>
                </div>
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm rounded-xl px-6 py-2.5 shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30 transition-all inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar primeira conta
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accounts.map((account) => (
                  <div key={account.id} className="auth-card p-6 flex flex-col justify-between hover:border-violet-500/30 transition-all group">
                    <div className="space-y-4">
                      {/* Top Header Card */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/80 group-hover:border-zinc-700 transition-all">
                            {getAccountIcon(account.type)}
                          </div>
                          <div>
                            <h4 className="font-bold text-white tracking-tight">{account.name}</h4>
                            <p className="text-xs text-zinc-400 mt-0.5">{account.bank}</p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-800/80 border border-zinc-700 text-zinc-400 capitalize">
                          {account.type === 'CREDIT_CARD' ? 'Cartão' : account.type === 'SAVINGS' ? 'Poupança' : 'Corrente'}
                        </span>
                      </div>

                      {/* Main Balance */}
                      <div className="pt-2">
                        <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Saldo Atual</span>
                        <p className={`text-2xl font-bold tracking-tight mt-0.5 ${account.balance < 0 ? 'text-red-400' : 'text-zinc-100'}`}>
                          {formatCurrency(account.balance)}
                        </p>
                      </div>
                    </div>

                    {/* Credit Card Details */}
                    {account.type === 'CREDIT_CARD' && (
                      <div className="border-t border-zinc-800/80 pt-4 mt-6 space-y-3 text-xs text-zinc-400">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-zinc-500 block uppercase font-medium tracking-wider">Limite Total:</span>
                            <span className="font-semibold text-zinc-300">{formatCurrency(account.creditLimit || 0)}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block uppercase font-medium tracking-wider">Ciclo de Fatura:</span>
                            <span className="font-semibold text-zinc-300">Dia {account.closingDay} ao {account.dueDay}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800/30">
                          <div>
                            <span className="text-zinc-500 block uppercase font-medium tracking-wider">Limite Utilizado:</span>
                            <span className="font-semibold text-red-400">{formatCurrency(Math.abs(account.balance))}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block uppercase font-medium tracking-wider">Limite Disponível:</span>
                            <span className="font-semibold text-emerald-400">{formatCurrency((account.creditLimit || 0) + account.balance)}</span>
                          </div>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden">
                          <div 
                            className="bg-violet-600 h-1.5 rounded-full transition-all" 
                            style={{ 
                              width: `${Math.min(100, Math.max(0, (Math.abs(account.balance) / (account.creditLimit || 1)) * 100))}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal Overlay / Registration Form */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="auth-card w-full max-w-lg p-8 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={resetForm}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-bold">Cadastrar Nova Conta</h3>
              <p className="text-sm text-zinc-400 mt-1">Configure seus saldos ou cartões de crédito.</p>
            </div>

            {formError && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nome */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Nome da Conta *</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl py-2.5 px-4 text-white text-sm outline-none transition-all placeholder:text-zinc-600"
                    placeholder="Ex: Minha Conta Corrente"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isCreating}
                  />
                </div>

                {/* Instituição Financeira */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Banco / Instituição *</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl py-2.5 px-4 text-white text-sm outline-none transition-all placeholder:text-zinc-600"
                    placeholder="Ex: Nubank, Itaú..."
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    disabled={isCreating}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tipo de Conta */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Tipo *</label>
                  <select
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl py-2.5 px-4 text-white text-sm outline-none transition-all"
                    value={type}
                    onChange={(e) => setType(e.target.value as AccountType)}
                    disabled={isCreating}
                  >
                    <option value="CHECKING">Conta Corrente</option>
                    <option value="SAVINGS">Poupança</option>
                    <option value="CREDIT_CARD">Cartão de Crédito</option>
                  </select>
                </div>

                {/* Saldo Inicial */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Saldo Inicial ({user.currency}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl py-2.5 px-4 text-white text-sm outline-none transition-all placeholder:text-zinc-600"
                    placeholder="0.00"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    disabled={isCreating}
                  />
                </div>
              </div>

              {/* Credit Card Specific Fields */}
              {type === 'CREDIT_CARD' && (
                <div className="border-t border-zinc-800/80 pt-4 mt-2 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-violet-400">Parâmetros do Cartão de Crédito</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Limite de Crédito */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Limite ({user.currency}) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl py-2.5 px-4 text-white text-sm outline-none transition-all placeholder:text-zinc-600"
                        placeholder="1000.00"
                        value={creditLimit}
                        onChange={(e) => setCreditLimit(e.target.value)}
                        disabled={isCreating}
                      />
                    </div>

                    {/* Dia Fechamento */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Fechamento (Dia) *</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        required
                        className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl py-2.5 px-4 text-white text-sm outline-none transition-all placeholder:text-zinc-600"
                        placeholder="Ex: 5"
                        value={closingDay}
                        onChange={(e) => setClosingDay(e.target.value)}
                        disabled={isCreating}
                      />
                    </div>

                    {/* Dia Vencimento */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Vencimento (Dia) *</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        required
                        className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl py-2.5 px-4 text-white text-sm outline-none transition-all placeholder:text-zinc-600"
                        placeholder="Ex: 15"
                        value={dueDay}
                        onChange={(e) => setDueDay(e.target.value)}
                        disabled={isCreating}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-zinc-800/80 mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isCreating}
                  className="px-5 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-sm font-medium transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-medium rounded-xl py-2.5 px-6 shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30 transition-all flex items-center justify-center disabled:opacity-50 text-sm"
                >
                  {isCreating ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    'Salvar Conta'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
