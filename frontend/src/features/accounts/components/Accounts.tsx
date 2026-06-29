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
import type { Account, AccountType, AccountPayload } from '../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

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

  // Sort checking/savings first, then credit cards
  const sortedAccounts = [...accounts].sort((a, b) => {
    const aIsCard = a.type === 'CREDIT_CARD' ? 1 : 0;
    const bIsCard = b.type === 'CREDIT_CARD' ? 1 : 0;
    if (aIsCard !== bIsCard) return aIsCard - bIsCard;
    return a.name.localeCompare(b.name);
  });

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

  const getAccountIconCircle = (type: AccountType) => {
    const iconClasses = {
      CHECKING: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
      SAVINGS: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      CREDIT_CARD: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    }[type] || 'bg-zinc-800 text-zinc-400 border-zinc-700/50';

    const icon = {
      CHECKING: <Landmark className="w-5 h-5" />,
      SAVINGS: <PiggyBank className="w-5 h-5" />,
      CREDIT_CARD: <CreditCard className="w-5 h-5" />,
    }[type] || <HelpCircle className="w-5 h-5" />;

    return (
      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border shrink-0", iconClasses)}>
        {icon}
      </div>
    );
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: user.currency,
    }).format(val);
  };

  const renderMemberBadge = (account: Account) => {
    if (!isCouple) return null;

    const isJoint = account.name.toLowerCase().includes('conjunta') || 
                    account.name.toLowerCase().includes('casal') || 
                    account.bank.toLowerCase().includes('conjunta') || 
                    account.bank.toLowerCase().includes('casal');

    if (isJoint) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-violet-500/10 border-violet-500/20 text-violet-300">
          Casal
        </span>
      );
    }

    const isOwn = account.userId === user.id;
    return (
      <span className={cn(
        "text-[10px] font-bold px-2 py-0.5 rounded-md border",
        isOwn 
          ? "bg-violet-500/10 border-violet-500/20 text-violet-300"
          : "bg-pink-500/10 border-pink-500/20 text-pink-300"
      )}>
        {isOwn ? 'Você' : partnerName}
      </span>
    );
  };

  const renderBankAccount = (account: Account) => {
    const associatedCardsSum = creditCards
      .filter((card) => card.associatedAccountId === account.id)
      .reduce((sum, card) => sum + (card.balance || 0), 0);
    const projectedBalance = account.balance + associatedCardsSum;

    return (
      <div 
        key={account.id} 
        className="bg-bg-surface border border-border-subtle hover:border-brand/40 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 group min-h-[220px]"
      >
        <div className="space-y-4 w-full">
          {/* Top Header Card */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              {getAccountIconCircle(account.type)}
              <div>
                <h4 className="font-bold text-text-primary tracking-tight text-base">{account.bank}</h4>
                <p className="text-xs text-text-secondary mt-0.5">{account.name}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <Badge status="PAID">Ativo</Badge>
              {renderMemberBadge(account)}
            </div>
          </div>

          {/* Main Balance */}
          <div className="pt-2 space-y-3">
            <div>
              <span className="text-text-secondary text-xs font-semibold uppercase tracking-wider block">Saldo disponível</span>
              <p className={cn(
                "text-2xl font-bold tracking-tight mt-1",
                account.balance < 0 ? "text-danger" : "text-text-primary"
              )}>
                {formatCurrency(account.balance)}
              </p>
            </div>

            {associatedCardsSum < 0 && (
              <div className="pt-3 border-t border-border-subtle flex flex-col gap-1">
                <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider block">Saldo Projetado (Livre)</span>
                <p className={cn(
                  "text-base font-bold tracking-tight",
                  projectedBalance < 0 ? "text-danger" : "text-success"
                )}>
                  {formatCurrency(projectedBalance)}
                </p>
                <span className="text-[10px] text-text-muted">
                  Deduzindo {formatCurrency(Math.abs(associatedCardsSum))} em faturas vinculadas
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border-subtle/50 flex items-center justify-between text-xs text-text-secondary">
          <span>Tipo:</span>
          <span className="font-semibold text-text-primary">
            {account.type === 'SAVINGS' ? 'Poupança' : 'Conta Corrente'}
          </span>
        </div>
      </div>
    );
  };

  const renderCreditCard = (card: Account) => {
    const limit = card.creditLimit || 1;
    const currentInvoice = Math.abs(card.balance);
    const usagePercent = Math.round((currentInvoice / limit) * 100);

    let barColor = 'bg-brand'; // up to 70%
    if (usagePercent > 90) {
      barColor = 'bg-danger'; // > 90%
    } else if (usagePercent >= 70) {
      barColor = 'bg-warning'; // 70-90%
    }

    const payingAccount = bankAccounts.find((acc) => acc.id === card.associatedAccountId);

    return (
      <div 
        key={card.id} 
        className="bg-bg-surface border border-border-subtle hover:border-brand/40 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 group min-h-[220px]"
      >
        <div className="space-y-4 w-full">
          {/* Top Header Card */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              {getAccountIconCircle(card.type)}
              <div>
                <h4 className="font-bold text-text-primary tracking-tight text-base">{card.bank}</h4>
                <p className="text-xs text-text-secondary mt-0.5">{card.name}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 uppercase">
                Crédito
              </span>
              {renderMemberBadge(card)}
            </div>
          </div>

          {/* Main Balance */}
          <div className="pt-2 space-y-3">
            <div>
              <span className="text-text-secondary text-xs font-semibold uppercase tracking-wider block">Fatura atual</span>
              <p className="text-2xl font-bold text-text-primary tracking-tight mt-1">
                {formatCurrency(currentInvoice)} <span className="text-sm font-normal text-text-secondary">/ {formatCurrency(card.creditLimit || 0)}</span>
              </p>
            </div>

            {/* Usage Limit Bar */}
            <div className="space-y-1.5 w-full">
              <div className="flex justify-between items-center text-[10px] text-text-secondary">
                <span>Uso do limite</span>
                <span className="font-semibold">{usagePercent}%</span>
              </div>
              <div className="w-full bg-bg-elevated h-2 rounded-full overflow-hidden">
                <div 
                  className={cn('h-full rounded-full transition-all duration-300', barColor)} 
                  style={{ width: `${Math.min(usagePercent, 100)}%` }} 
                />
              </div>
              {payingAccount && (
                <p className="text-[10px] text-text-muted mt-1">
                  Pagamento: <span className="font-medium text-text-secondary">{payingAccount.name}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border-subtle/50 flex items-center justify-between text-sm text-text-muted">
          <span>Fatura:</span>
          <span className="font-semibold text-text-secondary">
            Fecha dia {card.closingDay} · Vence dia {card.dueDay}
          </span>
        </div>
      </div>
    );
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
            <h1 className="text-3xl font-bold tracking-tight text-white animate-fade-in">Minhas Contas</h1>
            <p className="text-text-secondary text-sm mt-1">Gerencie suas contas e cartões de crédito</p>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-brand hover:bg-brand-hover active:bg-brand text-white font-medium text-sm rounded-xl px-4 py-2.5 shadow-lg shadow-brand/25 transition-all flex items-center gap-2 self-start sm:self-center cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Conta</span>
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-danger max-w-lg mx-auto text-center space-y-4">
            <AlertTriangle className="w-12 h-12 mx-auto" />
            <h3 className="font-bold text-lg">Erro ao carregar contas</h3>
            <p className="text-sm text-red-400/80">{error.message}</p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Grid of Accounts */}
            {accounts.length === 0 ? (
              <div className="bg-bg-surface border border-border-subtle p-12 text-center max-w-lg mx-auto space-y-6 rounded-2xl">
                <div className="w-16 h-16 bg-bg-elevated rounded-2xl flex items-center justify-center mx-auto border border-border-subtle">
                  <Landmark className="w-8 h-8 text-text-secondary" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold">Nenhuma conta cadastrada</h3>
                  <p className="text-sm text-text-secondary">Comece adicionando uma conta corrente, poupança ou cartão de crédito.</p>
                </div>
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="bg-brand hover:bg-brand-hover text-white font-medium text-sm rounded-xl px-6 py-2.5 shadow-lg shadow-brand/20 hover:shadow-brand/30 transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar primeira conta
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedAccounts.map((account) => {
                  if (account.type === 'CREDIT_CARD') {
                    return renderCreditCard(account);
                  } else {
                    return renderBankAccount(account);
                  }
                })}
                {/* Phantom Card (Nova Conta Button) */}
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="border-2 border-dashed border-border-subtle bg-bg-surface/20 hover:bg-bg-surface/40 hover:border-brand/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 transition-all cursor-pointer group min-h-[220px]"
                >
                  <div className="w-12 h-12 rounded-full bg-bg-elevated flex items-center justify-center border border-border-subtle group-hover:border-brand/40 group-hover:bg-brand/10 transition-all">
                    <Plus className="w-6 h-6 text-text-secondary group-hover:text-brand transition-all" />
                  </div>
                  <div>
                    <p className="font-bold text-text-secondary group-hover:text-text-primary transition-colors">Nova Conta</p>
                    <p className="text-xs text-text-muted mt-1">Adicione uma conta ou cartão</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal Overlay / Registration Form */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-surface border border-border-subtle w-full max-w-lg p-8 relative rounded-2xl animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={resetForm}
              className="absolute top-4 right-4 text-text-secondary hover:text-white p-1.5 hover:bg-bg-elevated rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-text-primary">Cadastrar Nova Conta</h3>
              <p className="text-sm text-text-secondary mt-1">Configure seus saldos ou cartões de crédito.</p>
            </div>

            {formError && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-danger text-sm flex items-start gap-3">
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
                <div className="border-t border-border-subtle pt-4 mt-2 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-brand">Parâmetros do Cartão de Crédito</h4>
                  
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
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-border-subtle mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isCreating}
                  className="px-5 py-2.5 rounded-xl border border-border-subtle hover:bg-bg-elevated text-text-secondary text-sm font-medium transition-all cursor-pointer"
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
