import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Landmark, CreditCard, PiggyBank, AlertTriangle, X } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { parseCurrencyToNumber } from '../../../utils/formatters';
import { useUpdateAccount } from '../hooks/useAccounts';
import type { Account, AccountPayload, UpdateAccountPayload } from '../types';

// ────────────────── Schemas ──────────────────

const bankAccountSchema = z.object({
  name: z.string().min(1, 'Apelido da conta é obrigatório'),
  bank: z.string().min(1, 'Banco / Instituição é obrigatório'),
  type: z.enum(['CHECKING', 'SAVINGS']),
  balance: z.preprocess(parseCurrencyToNumber, z.number({ message: 'Saldo inválido' })),
});

const creditCardSchema = z.object({
  name: z.string().min(1, 'Apelido do cartão é obrigatório'),
  bank: z.string().min(1, 'Emissor / Bandeira é obrigatório'),
  creditLimit: z.preprocess(
    parseCurrencyToNumber,
    z.number({ message: 'Limite inválido' }).min(1, 'Informe um limite válido')
  ),
  closingDay: z.coerce.number().min(1, 'Entre 1 e 31').max(31, 'Entre 1 e 31'),
  dueDay: z.coerce.number().min(1, 'Entre 1 e 31').max(31, 'Entre 1 e 31'),
  associatedAccountId: z.string().optional().nullable(),
});

const editBankSchema = z.object({
  name: z.string().min(1, 'Apelido é obrigatório'),
  bank: z.string().min(1, 'Banco é obrigatório'),
  balance: z.preprocess(parseCurrencyToNumber, z.number({ message: 'Saldo inválido' })),
});

const editCardSchema = z.object({
  name: z.string().min(1, 'Apelido é obrigatório'),
  bank: z.string().min(1, 'Emissor é obrigatório'),
  creditLimit: z.preprocess(
    parseCurrencyToNumber,
    z.number({ message: 'Limite inválido' }).min(1, 'Limite inválido')
  ),
  closingDay: z.coerce.number().min(1).max(31),
  dueDay: z.coerce.number().min(1).max(31),
});

type BankAccountFormData = z.infer<typeof bankAccountSchema>;
type CreditCardFormData = z.infer<typeof creditCardSchema>;
type EditBankFormData = z.infer<typeof editBankSchema>;
type EditCardFormData = z.infer<typeof editCardSchema>;

export function parseApiError(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as { message?: string; status?: number };
    if (e.status === 409) {
      const msg = e.message || '';
      if (msg.includes('NON_ZERO_BALANCE'))
        return 'A conta precisa ter saldo zero para ser encerrada.';
      if (msg.includes('CARD_HAS_PENDING_TRANSACTIONS'))
        return 'O cartão possui transações PENDENTES ou PLANEJADAS. Quite-as antes de arquivar.';
      if (msg.includes('ACCOUNT_HAS_TRANSACTIONS'))
        return 'Esta conta possui transações. Para removê-la, arquive-a primeiro.';
      if (msg.includes('ALREADY_ARCHIVED')) return 'Esta conta já está arquivada.';
      if (msg.includes('ALREADY_CLOSED')) return 'Esta conta já está encerrada.';
      if (msg.includes('CREDIT_CARD_CANNOT_BE_CLOSED'))
        return 'Cartões de crédito não podem ser encerrados. Use "Arquivar" em vez disso.';
      return e.message || 'Operação bloqueada por regra de negócio.';
    }
    return e.message || 'Ocorreu um erro inesperado.';
  }
  return 'Ocorreu um erro inesperado.';
}

// ────────────────── Create Bank Account Modal ──────────────────

interface CreateBankModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: AccountPayload) => Promise<Account>;
  isCreating: boolean;
  currency: string;
}

export function CreateBankModal({
  open,
  onClose,
  onCreate,
  isCreating,
  currency,
}: CreateBankModalProps) {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BankAccountFormData>({
    resolver: zodResolver(bankAccountSchema) as unknown as import('react-hook-form').Resolver<BankAccountFormData>,
    defaultValues: { name: '', bank: '', type: 'CHECKING', balance: 0 },
  });

  const handleClose = () => {
    reset();
    setError(null);
    onClose();
  };

  const onSubmit = async (data: BankAccountFormData) => {
    setError(null);
    try {
      await onCreate({ name: data.name, bank: data.bank, type: data.type, balance: data.balance });
      handleClose();
    } catch (err) {
      setError(parseApiError(err));
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-bg-surface border border-border-subtle w-full max-w-lg p-8 relative rounded-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-white p-1.5 hover:bg-bg-elevated rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Landmark className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-primary">Nova Conta Bancária</h3>
            <p className="text-xs text-text-secondary mt-0.5">Conta corrente ou poupança</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-danger text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="text"
              label="Apelido *"
              placeholder="Ex: Conta do Dia a Dia"
              error={errors.name?.message}
              disabled={isCreating}
              {...register('name')}
            />
            <Input
              type="text"
              label="Banco / Instituição *"
              placeholder="Ex: Nubank, Itaú…"
              error={errors.bank?.message}
              disabled={isCreating}
              {...register('bank')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Tipo *" error={errors.type?.message} disabled={isCreating} {...register('type')}>
              <option value="CHECKING" className="bg-zinc-900">
                Conta Corrente
              </option>
              <option value="SAVINGS" className="bg-zinc-900">
                Poupança
              </option>
            </Select>
            <Input
              isCurrency={true}
              label={`Saldo atual (${currency}) *`}
              placeholder="0,00"
              error={errors.balance?.message}
              disabled={isCreating}
              {...register('balance')}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-5 border-t border-border-subtle">
            <button
              type="button"
              onClick={handleClose}
              disabled={isCreating}
              className="px-5 py-2.5 rounded-xl border border-border-subtle hover:bg-bg-elevated text-text-secondary text-sm font-medium transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <Button type="submit" loading={isCreating} className="px-6">
              Salvar Conta
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ────────────────── Create Credit Card Modal ──────────────────

interface CreateCardModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: AccountPayload) => Promise<Account>;
  isCreating: boolean;
  currency: string;
  bankAccounts: Account[];
  formatCurrency: (val: number) => string;
}

export function CreateCardModal({
  open,
  onClose,
  onCreate,
  isCreating,
  currency,
  bankAccounts,
  formatCurrency,
}: CreateCardModalProps) {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreditCardFormData>({
    resolver: zodResolver(creditCardSchema) as unknown as import('react-hook-form').Resolver<CreditCardFormData>,
    defaultValues: {
      name: '',
      bank: '',
      creditLimit: undefined,
      closingDay: undefined,
      dueDay: undefined,
      associatedAccountId: '',
    },
  });

  const handleClose = () => {
    reset();
    setError(null);
    onClose();
  };

  const onSubmit = async (data: CreditCardFormData) => {
    setError(null);
    try {
      await onCreate({
        name: data.name,
        bank: data.bank,
        type: 'CREDIT_CARD',
        balance: 0,
        creditLimit: data.creditLimit,
        closingDay: data.closingDay,
        dueDay: data.dueDay,
        associatedAccountId: data.associatedAccountId || null,
      });
      handleClose();
    } catch (err) {
      setError(parseApiError(err));
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-bg-surface border border-border-subtle w-full max-w-lg p-8 relative rounded-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-white p-1.5 hover:bg-bg-elevated rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-primary">Novo Cartão de Crédito</h3>
            <p className="text-xs text-text-secondary mt-0.5">Configure limite, fatura e vencimento</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-danger text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="text"
              label="Apelido do cartão *"
              placeholder="Ex: Nubank Roxinho"
              error={errors.name?.message}
              disabled={isCreating}
              {...register('name')}
            />
            <Input
              type="text"
              label="Emissor / Bandeira *"
              placeholder="Ex: Nubank, Mastercard…"
              error={errors.bank?.message}
              disabled={isCreating}
              {...register('bank')}
            />
          </div>

          <Input
            isCurrency={true}
            label={`Limite de crédito (${currency}) *`}
            placeholder="Ex: 5.000,00"
            error={errors.creditLimit?.message}
            disabled={isCreating}
            {...register('creditLimit')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              min="1"
              max="31"
              label="Fechamento da fatura (dia) *"
              placeholder="Ex: 10"
              error={errors.closingDay?.message}
              disabled={isCreating}
              {...register('closingDay')}
            />
            <Input
              type="number"
              min="1"
              max="31"
              label="Vencimento da fatura (dia) *"
              placeholder="Ex: 20"
              error={errors.dueDay?.message}
              disabled={isCreating}
              {...register('dueDay')}
            />
          </div>

          <Select
            label="Conta para débito automático (opcional)"
            error={errors.associatedAccountId?.message}
            disabled={isCreating}
            {...register('associatedAccountId')}
          >
            <option value="" className="bg-zinc-900">
              Nenhuma — pagar manualmente
            </option>
            {bankAccounts.map((acc) => (
              <option key={acc.id} value={acc.id} className="bg-zinc-900">
                {acc.name} — {acc.bank} · Saldo: {formatCurrency(acc.balance)}
              </option>
            ))}
          </Select>

          <div className="flex items-center justify-end gap-3 pt-5 border-t border-border-subtle">
            <button
              type="button"
              onClick={handleClose}
              disabled={isCreating}
              className="px-5 py-2.5 rounded-xl border border-border-subtle hover:bg-bg-elevated text-text-secondary text-sm font-medium transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <Button type="submit" loading={isCreating} className="px-6">
              Salvar Cartão
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ────────────────── Edit Bank Modal ──────────────────

function EditBankModal({
  account,
  onClose,
  currency,
}: {
  account: Account;
  onClose: () => void;
  currency: string;
}) {
  const updateAccount = useUpdateAccount();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditBankFormData>({
    resolver: zodResolver(editBankSchema) as unknown as import('react-hook-form').Resolver<EditBankFormData>,
    defaultValues: { name: account.name, bank: account.bank, balance: account.balance },
  });

  useEffect(() => {
    reset({ name: account.name, bank: account.bank, balance: account.balance });
    setFormError(null);
  }, [account, reset]);

  const onSubmit = async (data: EditBankFormData) => {
    setFormError(null);
    try {
      const payload: UpdateAccountPayload = {
        name: data.name,
        bank: data.bank,
        balance: data.balance,
      };
      await updateAccount.mutateAsync({ id: account.id, payload });
      onClose();
    } catch (err) {
      setFormError(parseApiError(err));
    }
  };

  const isSavings = account.type === 'SAVINGS';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-bg-surface border border-border-subtle w-full max-w-lg p-8 relative rounded-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-white p-1.5 hover:bg-bg-elevated rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            {isSavings ? (
              <PiggyBank className="w-5 h-5 text-emerald-400" />
            ) : (
              <Landmark className="w-5 h-5 text-violet-400" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-primary">
              Editar {isSavings ? 'Poupança' : 'Conta Corrente'}
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">O tipo da conta não pode ser alterado</p>
          </div>
        </div>

        {formError && (
          <div className="mb-5 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-danger text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="text"
              label="Apelido *"
              error={errors.name?.message}
              disabled={updateAccount.isPending}
              {...register('name')}
            />
            <Input
              type="text"
              label="Banco / Instituição *"
              error={errors.bank?.message}
              disabled={updateAccount.isPending}
              {...register('bank')}
            />
          </div>
          <Input
            isCurrency={true}
            label={`Saldo atual (${currency}) *`}
            error={errors.balance?.message}
            disabled={updateAccount.isPending}
            {...register('balance')}
          />

          <div className="flex items-center justify-end gap-3 pt-5 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              disabled={updateAccount.isPending}
              className="px-5 py-2.5 rounded-xl border border-border-subtle hover:bg-bg-elevated text-text-secondary text-sm font-medium transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <Button type="submit" loading={updateAccount.isPending} className="px-6">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ────────────────── Edit Card Modal ──────────────────

function EditCardModal({
  account,
  onClose,
  currency,
}: {
  account: Account;
  onClose: () => void;
  currency: string;
}) {
  const updateAccount = useUpdateAccount();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditCardFormData>({
    resolver: zodResolver(editCardSchema) as unknown as import('react-hook-form').Resolver<EditCardFormData>,
    defaultValues: {
      name: account.name,
      bank: account.bank,
      creditLimit: account.creditLimit ?? undefined,
      closingDay: account.closingDay ?? undefined,
      dueDay: account.dueDay ?? undefined,
    },
  });

  useEffect(() => {
    reset({
      name: account.name,
      bank: account.bank,
      creditLimit: account.creditLimit ?? undefined,
      closingDay: account.closingDay ?? undefined,
      dueDay: account.dueDay ?? undefined,
    });
    setFormError(null);
  }, [account, reset]);

  const onSubmit = async (data: EditCardFormData) => {
    setFormError(null);
    try {
      const payload: UpdateAccountPayload = {
        name: data.name,
        bank: data.bank,
        creditLimit: data.creditLimit,
        closingDay: data.closingDay,
        dueDay: data.dueDay,
      };
      await updateAccount.mutateAsync({ id: account.id, payload });
      onClose();
    } catch (err) {
      setFormError(parseApiError(err));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-bg-surface border border-border-subtle w-full max-w-lg p-8 relative rounded-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-white p-1.5 hover:bg-bg-elevated rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-primary">Editar Cartão de Crédito</h3>
            <p className="text-xs text-text-secondary mt-0.5">Ajuste limite, fatura e vencimento</p>
          </div>
        </div>

        {formError && (
          <div className="mb-5 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-danger text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="text"
              label="Apelido do cartão *"
              error={errors.name?.message}
              disabled={updateAccount.isPending}
              {...register('name')}
            />
            <Input
              type="text"
              label="Emissor / Bandeira *"
              error={errors.bank?.message}
              disabled={updateAccount.isPending}
              {...register('bank')}
            />
          </div>

          <Input
            isCurrency={true}
            label={`Limite de crédito (${currency}) *`}
            error={errors.creditLimit?.message}
            disabled={updateAccount.isPending}
            {...register('creditLimit')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              min="1"
              max="31"
              label="Fechamento da fatura (dia) *"
              error={errors.closingDay?.message}
              disabled={updateAccount.isPending}
              {...register('closingDay')}
            />
            <Input
              type="number"
              min="1"
              max="31"
              label="Vencimento da fatura (dia) *"
              error={errors.dueDay?.message}
              disabled={updateAccount.isPending}
              {...register('dueDay')}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-5 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              disabled={updateAccount.isPending}
              className="px-5 py-2.5 rounded-xl border border-border-subtle hover:bg-bg-elevated text-text-secondary text-sm font-medium transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <Button type="submit" loading={updateAccount.isPending} className="px-6">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditModalProps {
  account: Account | null;
  onClose: () => void;
  currency: string;
}

export function EditModal({ account, onClose, currency }: EditModalProps) {
  if (!account) return null;
  if (account.type === 'CREDIT_CARD') {
    return <EditCardModal account={account} onClose={onClose} currency={currency} />;
  }
  return <EditBankModal account={account} onClose={onClose} currency={currency} />;
}
