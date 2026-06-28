import { useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useAccounts } from '../hooks/useAccounts';
import { useView } from '../../../context/ViewContext';
import { useCouple } from '../../couple/hooks/useCouple';
import { cn } from '../../../lib/cn';
import { 
  Plus, CreditCard, Landmark, PiggyBank, 
  HelpCircle, AlertTriangle, X 
} from 'lucide-react';
import type { AccountType, AccountPayload } from '../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';

const accountSchema = z.object({
  name: z.string().min(1, 'Nome da conta é obrigatório'),
  bank: z.string().min(1, 'Banco/Instituição é obrigatório'),
  type: z.enum(['CHECKING', 'SAVINGS', 'CREDIT_CARD']),
  balance: z.coerce.number({ message: 'Saldo inválido' }),
  creditLimit: z.coerce.number().optional(),
  closingDay: z.coerce.number().optional(),
  dueDay: z.coerce.number().optional(),
  associatedAccountId: z.string().optional().nullable(),
}).refine((data) => {
  if (data.type === 'CREDIT_CARD') {
    return data.creditLimit !== undefined && data.creditLimit >= 0;
  }
  return true;
}, {
  message: 'Limite de crédito inválido',
  path: ['creditLimit'],
}).refine((data) => {
  if (data.type === 'CREDIT_CARD') {
    return data.closingDay !== undefined && data.closingDay >= 1 && data.closingDay <= 31;
  }
  return true;
}, {
  message: 'Dia de fechamento deve ser entre 1 e 31',
  path: ['closingDay'],
}).refine((data) => {
  if (data.type === 'CREDIT_CARD') {
    return data.dueDay !== undefined && data.dueDay >= 1 && data.dueDay <= 31;
  }
  return true;
}, {
  message: 'Dia de vencimento deve ser entre 1 e 31',
  path: ['dueDay'],
});

type AccountFormData = z.infer<typeof accountSchema>;

export function Accounts() {
  const { user } = useAuth();
  const { accounts, isLoading, error, createAccount, isCreating } = useAccounts();
  const { viewContext } = useView();
  const { coupleStatus } = useCouple();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isCouple = viewContext === 'COUPLE';
  const partnerName = coupleStatus.partnerName || 'Parceiro(a)';

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<AccountFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(accountSchema) as any,
    defaultValues: {
      name: '',
      bank: '',
      type: 'CHECKING',
      balance: 0,
      creditLimit: undefined,
      closingDay: undefined,
      dueDay: undefined,
      associatedAccountId: '',
    },
  });

  const watchedType = watch('type');

  if (!user) return null;

  const bankAccounts = accounts.filter((acc) => acc.type === 'CHECKING' || acc.type === 'SAVINGS');
  const creditCards = accounts.filter((acc) => acc.type === 'CREDIT_CARD');

  const resetForm = () => {
    reset();
    setFormError(null);
    setIsFormOpen(false);
  };

  const onSubmit = async (data: AccountFormData) => {
    setFormError(null);

    const payload: AccountPayload = {
      name: data.name,
      type: data.type,
      bank: data.bank,
      balance: data.balance,
    };

    if (data.type === 'CREDIT_CARD') {
      payload.creditLimit = data.creditLimit;
      payload.closingDay = data.closingDay;
      payload.dueDay = data.dueDay;
      payload.associatedAccountId = data.associatedAccountId || null;
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
      {/* Couple context banner — visible only in COUPLE mode */}
      {isCouple && (
        <div className="bg-violet-500/10 border-b border-violet-500/20 py-2 text-center">
          <span className="text-violet-300 text-xs font-medium">
            🫂 Você está vendo as contas do casal ({user.name} & {partnerName})
          </span>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Minhas Contas</h1>
            <p className="text-zinc-400 text-sm mt-1">Gerencie suas contas e cartões de crédito</p>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-medium text-sm rounded-xl px-4 py-2.5 shadow-lg shadow-violet-500/25 transition-all flex items-center gap-2 self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Conta</span>
          </button>
        </div>

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
              <div className="space-y-12">
                {/* Contas Bancárias */}
                {bankAccounts.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-zinc-350 tracking-tight flex items-center gap-2">
                      <Landmark className="w-5 h-5 text-violet-400" />
                      <span>Contas Bancárias</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {bankAccounts.map((account) => {
                        const associatedCardsSum = creditCards
                          .filter((card) => card.associatedAccountId === account.id)
                          .reduce((sum, card) => sum + (card.balance || 0), 0);
                        const projectedBalance = account.balance + associatedCardsSum;

                        return (
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
                                <div className="flex flex-col items-end gap-1.5">
                                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-800/80 border border-zinc-700 text-zinc-400 capitalize">
                                    {account.type === 'SAVINGS' ? 'Poupança' : 'Corrente'}
                                  </span>
                                  {isCouple && (
                                    <span className={cn(
                                      "text-[10px] font-bold px-2 py-0.5 rounded-md border",
                                      account.userId === user.id 
                                        ? "bg-violet-500/10 border-violet-500/20 text-violet-300"
                                        : "bg-pink-500/10 border-pink-500/20 text-pink-300"
                                    )}>
                                      {account.userId === user.id ? 'Você' : partnerName}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Main Balance */}
                              <div className="pt-2 space-y-3">
                                <div>
                                  <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Saldo Atual</span>
                                  <p className={`text-2xl font-bold tracking-tight mt-0.5 ${account.balance < 0 ? 'text-red-400' : 'text-zinc-100'}`}>
                                    {formatCurrency(account.balance)}
                                  </p>
                                </div>

                                {associatedCardsSum < 0 && (
                                  <div className="pt-3 border-t border-zinc-805 flex flex-col gap-1">
                                    <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Saldo Projetado (Livre)</span>
                                    <p className={`text-lg font-bold tracking-tight ${projectedBalance < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                      {formatCurrency(projectedBalance)}
                                    </p>
                                    <span className="text-[10px] text-zinc-500">
                                      Deduzindo {formatCurrency(Math.abs(associatedCardsSum))} em faturas vinculadas
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Cartões de Crédito */}
                {creditCards.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-zinc-350 tracking-tight flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-blue-400" />
                      <span>Cartões de Crédito</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {creditCards.map((card) => {
                        const payingAccount = bankAccounts.find((acc) => acc.id === card.associatedAccountId);
                        return (
                          <div key={card.id} className="relative bg-gradient-to-br from-zinc-900 to-indigo-950/20 p-6 rounded-2xl border border-zinc-800 hover:border-violet-500/30 transition-all flex flex-col justify-between group">
                            <div className="space-y-4">
                              {/* Top Header Card */}
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/80 group-hover:border-zinc-700 transition-all">
                                    {getAccountIcon(card.type)}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-white tracking-tight">{card.name}</h4>
                                    <p className="text-xs text-zinc-400 mt-0.5">{card.bank}</p>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1.5">
                                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-800/80 border border-zinc-700 text-zinc-400">
                                    Cartão
                                  </span>
                                  {isCouple && (
                                    <span className={cn(
                                      "text-[10px] font-bold px-2 py-0.5 rounded-md border",
                                      card.userId === user.id 
                                        ? "bg-violet-500/10 border-violet-500/20 text-violet-300"
                                        : "bg-pink-500/10 border-pink-500/20 text-pink-300"
                                    )}>
                                      {card.userId === user.id ? 'Você' : partnerName}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Main Balance */}
                              <div className="pt-2">
                                <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Fatura Atual</span>
                                <p className={`text-2xl font-bold tracking-tight mt-0.5 ${card.balance < 0 ? 'text-red-400' : 'text-zinc-100'}`}>
                                  {formatCurrency(Math.abs(card.balance))}
                                </p>
                              </div>

                              {/* Credit Card Details */}
                              <div className="border-t border-zinc-800/80 pt-4 space-y-3 text-xs text-zinc-400">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <span className="text-zinc-500 block uppercase font-medium tracking-wider">Limite Total:</span>
                                    <span className="font-semibold text-zinc-300">{formatCurrency(card.creditLimit || 0)}</span>
                                  </div>
                                  <div>
                                    <span className="text-zinc-500 block uppercase font-medium tracking-wider">Ciclo de Fatura:</span>
                                    <span className="font-semibold text-zinc-300">Dia {card.closingDay} ao {card.dueDay}</span>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800/30">
                                  <div>
                                    <span className="text-zinc-500 block uppercase font-medium tracking-wider">Limite Disponível:</span>
                                    <span className="font-semibold text-emerald-400">{formatCurrency((card.creditLimit || 0) + card.balance)}</span>
                                  </div>
                                  <div>
                                    <span className="text-zinc-500 block uppercase font-medium tracking-wider">Conta de Pagamento:</span>
                                    <span className="font-semibold text-violet-400 truncate block">
                                      {payingAccount ? payingAccount.name : 'Avulso'}
                                    </span>
                                  </div>
                                </div>
                                <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden">
                                  <div 
                                    className="bg-violet-600 h-1.5 rounded-full transition-all" 
                                    style={{ 
                                      width: `${Math.min(100, Math.max(0, (Math.abs(card.balance) / (card.creditLimit || 1)) * 100))}%` 
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nome */}
                <Input
                  type="text"
                  label="Nome da Conta *"
                  placeholder="Ex: Minha Conta Corrente"
                  error={errors.name?.message}
                  disabled={isCreating}
                  {...register('name')}
                />

                {/* Instituição Financeira */}
                <Input
                  type="text"
                  label="Banco / Instituição *"
                  placeholder="Ex: Nubank, Itaú..."
                  error={errors.bank?.message}
                  disabled={isCreating}
                  {...register('bank')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tipo de Conta */}
                <Select
                  label="Tipo *"
                  error={errors.type?.message}
                  disabled={isCreating}
                  {...register('type')}
                >
                  <option value="CHECKING" className="bg-zinc-900">Conta Corrente</option>
                  <option value="SAVINGS" className="bg-zinc-900">Poupança</option>
                  <option value="CREDIT_CARD" className="bg-zinc-900">Cartão de Crédito</option>
                </Select>

                {/* Saldo Inicial */}
                <Input
                  type="number"
                  step="0.01"
                  label={`Saldo Inicial (${user.currency}) *`}
                  placeholder="0.00"
                  error={errors.balance?.message}
                  disabled={isCreating}
                  {...register('balance')}
                />
              </div>

              {/* Credit Card Specific Fields */}
              {watchedType === 'CREDIT_CARD' && (
                <div className="border-t border-zinc-800/80 pt-4 mt-2 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-violet-400">Parâmetros do Cartão de Crédito</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Limite de Crédito */}
                    <Input
                      type="number"
                      step="0.01"
                      label={`Limite (${user.currency}) *`}
                      placeholder="1000.00"
                      error={errors.creditLimit?.message}
                      disabled={isCreating}
                      {...register('creditLimit')}
                    />

                    {/* Dia Fechamento */}
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      label="Fechamento (Dia) *"
                      placeholder="Ex: 5"
                      error={errors.closingDay?.message}
                      disabled={isCreating}
                      {...register('closingDay')}
                    />

                    {/* Dia Vencimento */}
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      label="Vencimento (Dia) *"
                      placeholder="Ex: 15"
                      error={errors.dueDay?.message}
                      disabled={isCreating}
                      {...register('dueDay')}
                    />
                  </div>

                  <Select
                    label="Conta de Pagamento Associada (opcional)"
                    error={errors.associatedAccountId?.message}
                    disabled={isCreating}
                    {...register('associatedAccountId')}
                  >
                    <option value="" className="bg-zinc-900">Nenhuma (Cartão Avulso)</option>
                    {bankAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id} className="bg-zinc-900">
                        {acc.name} ({acc.bank}) - Saldo: {formatCurrency(acc.balance)}
                      </option>
                    ))}
                  </Select>
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
                <Button
                  type="submit"
                  loading={isCreating}
                  className="px-6"
                >
                  Salvar Conta
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
