import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useAccounts, useUpdateAccount, useArchiveAccount, useUnarchiveAccount, useCloseAccount, useDeleteAccount } from '../hooks/useAccounts';
import { useView } from '../../../context/ViewContext';
import { useCouple } from '../../couple/hooks/useCouple';
import { cn } from '../../../lib/cn';
import {
  Plus, CreditCard, Landmark, PiggyBank,
  HelpCircle, AlertTriangle, X, MoreVertical,
  Pencil, Archive, ArchiveRestore, Lock, Trash2,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import type { Account, AccountType, AccountPayload, UpdateAccountPayload } from '../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

// ────────────────── Schemas ──────────────────

const bankAccountSchema = z.object({
  name: z.string().min(1, 'Apelido da conta é obrigatório'),
  bank: z.string().min(1, 'Banco / Instituição é obrigatório'),
  type: z.enum(['CHECKING', 'SAVINGS']),
  balance: z.coerce.number({ message: 'Saldo inválido' }),
});

const creditCardSchema = z.object({
  name: z.string().min(1, 'Apelido do cartão é obrigatório'),
  bank: z.string().min(1, 'Emissor / Bandeira é obrigatório'),
  creditLimit: z.coerce.number({ message: 'Limite inválido' }).min(1, 'Informe um limite válido'),
  closingDay: z.coerce.number().min(1, 'Entre 1 e 31').max(31, 'Entre 1 e 31'),
  dueDay: z.coerce.number().min(1, 'Entre 1 e 31').max(31, 'Entre 1 e 31'),
  associatedAccountId: z.string().optional().nullable(),
});

const editBankSchema = z.object({
  name: z.string().min(1, 'Apelido é obrigatório'),
  bank: z.string().min(1, 'Banco é obrigatório'),
  balance: z.coerce.number({ message: 'Saldo inválido' }),
});

const editCardSchema = z.object({
  name: z.string().min(1, 'Apelido é obrigatório'),
  bank: z.string().min(1, 'Emissor é obrigatório'),
  creditLimit: z.coerce.number().min(1, 'Limite inválido'),
  closingDay: z.coerce.number().min(1).max(31),
  dueDay: z.coerce.number().min(1).max(31),
});

type BankAccountFormData = z.infer<typeof bankAccountSchema>;
type CreditCardFormData = z.infer<typeof creditCardSchema>;
type EditBankFormData = z.infer<typeof editBankSchema>;
type EditCardFormData = z.infer<typeof editCardSchema>;

// ────────────────── Error helper ──────────────────

function parseApiError(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as { message?: string; status?: number };
    if (e.status === 409) {
      const msg = e.message || '';
      if (msg.includes('NON_ZERO_BALANCE')) return 'A conta precisa ter saldo zero para ser encerrada.';
      if (msg.includes('CARD_HAS_PENDING_TRANSACTIONS')) return 'O cartão possui transações PENDENTES ou PLANEJADAS. Quite-as antes de arquivar.';
      if (msg.includes('ACCOUNT_HAS_TRANSACTIONS')) return 'Esta conta possui transações. Para removê-la, arquive-a primeiro.';
      if (msg.includes('ALREADY_ARCHIVED')) return 'Esta conta já está arquivada.';
      if (msg.includes('ALREADY_CLOSED')) return 'Esta conta já está encerrada.';
      if (msg.includes('CREDIT_CARD_CANNOT_BE_CLOSED')) return 'Cartões de crédito não podem ser encerrados. Use "Arquivar" em vez disso.';
      return e.message || 'Operação bloqueada por regra de negócio.';
    }
    return e.message || 'Ocorreu um erro inesperado.';
  }
  return 'Ocorreu um erro inesperado.';
}

// ────────────────── Dropdown Menu ──────────────────

type DropdownAction = {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
};

function AccountActionsMenu({ actions }: { actions: DropdownAction[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-bg-elevated text-text-secondary hover:text-text-primary transition-all cursor-pointer"
        aria-label="Ações"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 bg-bg-surface border border-border-subtle rounded-xl shadow-xl shadow-black/30 w-52 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => { action.onClick(); setOpen(false); }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left cursor-pointer',
                action.danger
                  ? 'text-danger hover:bg-red-500/10'
                  : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
              )}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────── Confirmation Modal ──────────────────

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  danger?: boolean;
  errorMessage?: string | null;
}

function ConfirmModal({ open, title, description, confirmLabel, onConfirm, onCancel, loading, danger, errorMessage }: ConfirmModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-bg-surface border border-border-subtle w-full max-w-md p-7 relative rounded-2xl animate-in fade-in zoom-in-95 duration-200 space-y-5">
        <button onClick={onCancel} className="absolute top-4 right-4 text-text-secondary hover:text-white p-1.5 hover:bg-bg-elevated rounded-lg transition-colors cursor-pointer">
          <X className="w-5 h-5" />
        </button>
        <div className="space-y-2">
          <h3 className={cn('text-lg font-bold', danger ? 'text-danger' : 'text-text-primary')}>{title}</h3>
          <p className="text-sm text-text-secondary">{description}</p>
        </div>
        {errorMessage && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-danger text-sm flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}
        <div className="flex items-center justify-end gap-3">
          <button onClick={onCancel} disabled={loading} className="px-5 py-2.5 rounded-xl border border-border-subtle hover:bg-bg-elevated text-text-secondary text-sm font-medium transition-all cursor-pointer">
            Cancelar
          </button>
          <Button onClick={onConfirm} loading={loading} className={cn('px-5', danger ? 'bg-red-600 hover:bg-red-700 shadow-red-900/20' : '')}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ────────────────── Create Bank Account Modal ──────────────────

interface CreateBankModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: AccountPayload) => Promise<any>;
  isCreating: boolean;
  currency: string;
}

function CreateBankModal({ open, onClose, onCreate, isCreating, currency }: CreateBankModalProps) {
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BankAccountFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(bankAccountSchema) as any,
    defaultValues: { name: '', bank: '', type: 'CHECKING', balance: 0 },
  });

  const handleClose = () => { reset(); setError(null); onClose(); };

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
        <button onClick={handleClose} className="absolute top-4 right-4 text-text-secondary hover:text-white p-1.5 hover:bg-bg-elevated rounded-lg transition-colors cursor-pointer">
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
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" /><span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input type="text" label="Apelido *" placeholder="Ex: Conta do Dia a Dia" error={errors.name?.message} disabled={isCreating} {...register('name')} />
            <Input type="text" label="Banco / Instituição *" placeholder="Ex: Nubank, Itaú…" error={errors.bank?.message} disabled={isCreating} {...register('bank')} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Tipo *" error={errors.type?.message} disabled={isCreating} {...register('type')}>
              <option value="CHECKING" className="bg-zinc-900">Conta Corrente</option>
              <option value="SAVINGS" className="bg-zinc-900">Poupança</option>
            </Select>
            <Input type="number" step="0.01" label={`Saldo atual (${currency}) *`} placeholder="0,00" error={errors.balance?.message} disabled={isCreating} {...register('balance')} />
          </div>

          <div className="flex items-center justify-end gap-3 pt-5 border-t border-border-subtle">
            <button type="button" onClick={handleClose} disabled={isCreating} className="px-5 py-2.5 rounded-xl border border-border-subtle hover:bg-bg-elevated text-text-secondary text-sm font-medium transition-all cursor-pointer">Cancelar</button>
            <Button type="submit" loading={isCreating} className="px-6">Salvar Conta</Button>
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
  onCreate: (payload: AccountPayload) => Promise<any>;
  isCreating: boolean;
  currency: string;
  bankAccounts: Account[];
  formatCurrency: (val: number) => string;
}

function CreateCardModal({ open, onClose, onCreate, isCreating, currency, bankAccounts, formatCurrency }: CreateCardModalProps) {
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreditCardFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(creditCardSchema) as any,
    defaultValues: { name: '', bank: '', creditLimit: undefined, closingDay: undefined, dueDay: undefined, associatedAccountId: '' },
  });

  const handleClose = () => { reset(); setError(null); onClose(); };

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
        <button onClick={handleClose} className="absolute top-4 right-4 text-text-secondary hover:text-white p-1.5 hover:bg-bg-elevated rounded-lg transition-colors cursor-pointer">
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
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" /><span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input type="text" label="Apelido do cartão *" placeholder="Ex: Nubank Roxinho" error={errors.name?.message} disabled={isCreating} {...register('name')} />
            <Input type="text" label="Emissor / Bandeira *" placeholder="Ex: Nubank, Mastercard…" error={errors.bank?.message} disabled={isCreating} {...register('bank')} />
          </div>

          <Input type="number" step="0.01" label={`Limite de crédito (${currency}) *`} placeholder="Ex: 5000,00" error={errors.creditLimit?.message} disabled={isCreating} {...register('creditLimit')} />

          <div className="grid grid-cols-2 gap-4">
            <Input type="number" min="1" max="31" label="Fechamento da fatura (dia) *" placeholder="Ex: 10" error={errors.closingDay?.message} disabled={isCreating} {...register('closingDay')} />
            <Input type="number" min="1" max="31" label="Vencimento da fatura (dia) *" placeholder="Ex: 20" error={errors.dueDay?.message} disabled={isCreating} {...register('dueDay')} />
          </div>

          <Select label="Conta para débito automático (opcional)" error={errors.associatedAccountId?.message} disabled={isCreating} {...register('associatedAccountId')}>
            <option value="" className="bg-zinc-900">Nenhuma — pagar manualmente</option>
            {bankAccounts.map((acc) => (
              <option key={acc.id} value={acc.id} className="bg-zinc-900">
                {acc.name} — {acc.bank} · Saldo: {formatCurrency(acc.balance)}
              </option>
            ))}
          </Select>

          <div className="flex items-center justify-end gap-3 pt-5 border-t border-border-subtle">
            <button type="button" onClick={handleClose} disabled={isCreating} className="px-5 py-2.5 rounded-xl border border-border-subtle hover:bg-bg-elevated text-text-secondary text-sm font-medium transition-all cursor-pointer">Cancelar</button>
            <Button type="submit" loading={isCreating} className="px-6">Salvar Cartão</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ────────────────── Edit Modal (type-aware) ──────────────────

interface EditModalProps {
  account: Account | null;
  onClose: () => void;
  bankAccounts: Account[];
  currency: string;
}

function EditBankModal({ account, onClose, currency }: { account: Account; onClose: () => void; currency: string }) {
  const updateAccount = useUpdateAccount();
  const [formError, setFormError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditBankFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(editBankSchema) as any,
    defaultValues: { name: account.name, bank: account.bank, balance: account.balance },
  });

  useEffect(() => {
    reset({ name: account.name, bank: account.bank, balance: account.balance });
    setFormError(null);
  }, [account, reset]);

  const onSubmit = async (data: EditBankFormData) => {
    setFormError(null);
    try {
      const payload: UpdateAccountPayload = { name: data.name, bank: data.bank, balance: data.balance };
      await updateAccount.mutateAsync({ id: account.id, payload });
      onClose();
    } catch (err) { setFormError(parseApiError(err)); }
  };

  const isSavings = account.type === 'SAVINGS';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-bg-surface border border-border-subtle w-full max-w-lg p-8 relative rounded-2xl animate-in fade-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-white p-1.5 hover:bg-bg-elevated rounded-lg transition-colors cursor-pointer">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            {isSavings ? <PiggyBank className="w-5 h-5 text-emerald-400" /> : <Landmark className="w-5 h-5 text-violet-400" />}
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-primary">Editar {isSavings ? 'Poupança' : 'Conta Corrente'}</h3>
            <p className="text-xs text-text-secondary mt-0.5">O tipo da conta não pode ser alterado</p>
          </div>
        </div>

        {formError && (
          <div className="mb-5 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-danger text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" /><span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input type="text" label="Apelido *" error={errors.name?.message} disabled={updateAccount.isPending} {...register('name')} />
            <Input type="text" label="Banco / Instituição *" error={errors.bank?.message} disabled={updateAccount.isPending} {...register('bank')} />
          </div>
          <Input type="number" step="0.01" label={`Saldo atual (${currency}) *`} error={errors.balance?.message} disabled={updateAccount.isPending} {...register('balance')} />

          <div className="flex items-center justify-end gap-3 pt-5 border-t border-border-subtle">
            <button type="button" onClick={onClose} disabled={updateAccount.isPending} className="px-5 py-2.5 rounded-xl border border-border-subtle hover:bg-bg-elevated text-text-secondary text-sm font-medium transition-all cursor-pointer">Cancelar</button>
            <Button type="submit" loading={updateAccount.isPending} className="px-6">Salvar Alterações</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditCardModal({ account, onClose, currency }: { account: Account; onClose: () => void; currency: string }) {
  const updateAccount = useUpdateAccount();
  const [formError, setFormError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditCardFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(editCardSchema) as any,
    defaultValues: {
      name: account.name, bank: account.bank,
      creditLimit: account.creditLimit ?? undefined,
      closingDay: account.closingDay ?? undefined,
      dueDay: account.dueDay ?? undefined,
    },
  });

  useEffect(() => {
    reset({
      name: account.name, bank: account.bank,
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
        name: data.name, bank: data.bank,
        creditLimit: data.creditLimit,
        closingDay: data.closingDay,
        dueDay: data.dueDay,
      };
      await updateAccount.mutateAsync({ id: account.id, payload });
      onClose();
    } catch (err) { setFormError(parseApiError(err)); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-bg-surface border border-border-subtle w-full max-w-lg p-8 relative rounded-2xl animate-in fade-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-white p-1.5 hover:bg-bg-elevated rounded-lg transition-colors cursor-pointer">
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
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" /><span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input type="text" label="Apelido do cartão *" error={errors.name?.message} disabled={updateAccount.isPending} {...register('name')} />
            <Input type="text" label="Emissor / Bandeira *" error={errors.bank?.message} disabled={updateAccount.isPending} {...register('bank')} />
          </div>

          <Input type="number" step="0.01" label={`Limite de crédito (${currency}) *`} error={errors.creditLimit?.message} disabled={updateAccount.isPending} {...register('creditLimit')} />

          <div className="grid grid-cols-2 gap-4">
            <Input type="number" min="1" max="31" label="Fechamento da fatura (dia) *" error={errors.closingDay?.message} disabled={updateAccount.isPending} {...register('closingDay')} />
            <Input type="number" min="1" max="31" label="Vencimento da fatura (dia) *" error={errors.dueDay?.message} disabled={updateAccount.isPending} {...register('dueDay')} />
          </div>

          <div className="flex items-center justify-end gap-3 pt-5 border-t border-border-subtle">
            <button type="button" onClick={onClose} disabled={updateAccount.isPending} className="px-5 py-2.5 rounded-xl border border-border-subtle hover:bg-bg-elevated text-text-secondary text-sm font-medium transition-all cursor-pointer">Cancelar</button>
            <Button type="submit" loading={updateAccount.isPending} className="px-6">Salvar Alterações</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditModal({ account, onClose, currency }: EditModalProps) {
  if (!account) return null;
  if (account.type === 'CREDIT_CARD') {
    return <EditCardModal account={account} onClose={onClose} currency={currency} />;
  }
  return <EditBankModal account={account} onClose={onClose} currency={currency} />;
}

// ────────────────── Main Component ──────────────────

export function Accounts() {
  const { user } = useAuth();
  const { accounts, isLoading, error, createAccount, isCreating } = useAccounts();
  const { viewContext } = useView();
  const { coupleStatus } = useCouple();

  // Mutations
  const archiveAccount = useArchiveAccount();
  const unarchiveAccount = useUnarchiveAccount();
  const closeAccount = useCloseAccount();
  const deleteAccount = useDeleteAccount();

  // UI state
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  // Confirm modals
  type ConfirmAction = 'archive' | 'unarchive' | 'close' | 'delete';
  const [confirm, setConfirm] = useState<{ action: ConfirmAction; account: Account } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const isCouple = viewContext === 'COUPLE';
  const partnerName = coupleStatus.partnerName || 'Parceiro(a)';

  if (!user) return null;

  // Split accounts by status
  const activeAccounts = accounts.filter((a) => a.status === 'ACTIVE' || a.status === 'CLOSED');
  const archivedAccounts = accounts.filter((a) => a.status === 'ARCHIVED');

  const bankAccounts = activeAccounts.filter((acc) => acc.type === 'CHECKING' || acc.type === 'SAVINGS');
  const creditCards = activeAccounts.filter((acc) => acc.type === 'CREDIT_CARD');

  const sortedActiveAccounts = [...activeAccounts].sort((a, b) => {
    const aIsCard = a.type === 'CREDIT_CARD' ? 1 : 0;
    const bIsCard = b.type === 'CREDIT_CARD' ? 1 : 0;
    if (aIsCard !== bIsCard) return aIsCard - bIsCard;
    return a.name.localeCompare(b.name);
  });

  const handleConfirm = async () => {
    if (!confirm) return;
    setConfirmLoading(true);
    setConfirmError(null);
    try {
      const id = confirm.account.id;
      if (confirm.action === 'archive') await archiveAccount.mutateAsync(id);
      if (confirm.action === 'unarchive') await unarchiveAccount.mutateAsync(id);
      if (confirm.action === 'close') await closeAccount.mutateAsync(id);
      if (confirm.action === 'delete') await deleteAccount.mutateAsync(id);
      setConfirm(null);
    } catch (err) {
      setConfirmError(parseApiError(err));
    } finally {
      setConfirmLoading(false);
    }
  };

  const confirmConfig: Record<ConfirmAction, { title: string; description: string; label: string; danger?: boolean }> = {
    archive: { title: 'Arquivar?', description: 'Ficará oculto das listas principais. Você pode reativar quando quiser.', label: 'Arquivar' },
    unarchive: { title: 'Reativar?', description: 'Voltará a aparecer normalmente nas listas e relatórios.', label: 'Reativar' },
    close: { title: 'Encerrar conta?', description: 'A conta será encerrada permanentemente. Só é possível encerrar contas com saldo zero. Essa ação não pode ser desfeita.', label: 'Encerrar conta', danger: true },
    delete: { title: 'Excluir permanentemente?', description: 'Só é possível excluir contas sem transações. Essa ação não pode ser desfeita.', label: 'Excluir', danger: true },
  };

  const getAccountIconCircle = (type: AccountType, muted = false) => {
    const iconClasses = muted
      ? 'bg-zinc-800/50 text-zinc-500 border-zinc-700/30'
      : ({ CHECKING: 'bg-violet-500/10 text-violet-400 border-violet-500/20', SAVINGS: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', CREDIT_CARD: 'bg-blue-500/10 text-blue-400 border-blue-500/20' }[type] || 'bg-zinc-800 text-zinc-400 border-zinc-700/50');

    const icon = { CHECKING: <Landmark className="w-5 h-5" />, SAVINGS: <PiggyBank className="w-5 h-5" />, CREDIT_CARD: <CreditCard className="w-5 h-5" /> }[type] || <HelpCircle className="w-5 h-5" />;

    return (
      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center border shrink-0', iconClasses)}>
        {icon}
      </div>
    );
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: user.currency }).format(val);

  const renderMemberBadge = (account: Account) => {
    if (!isCouple) return null;
    const isOwn = account.userId === user.id;
    return (
      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-md border', isOwn ? 'bg-violet-500/10 border-violet-500/20 text-violet-300' : 'bg-pink-500/10 border-pink-500/20 text-pink-300')}>
        {isOwn ? 'Você' : partnerName}
      </span>
    );
  };

  const getAccountActions = (account: Account): DropdownAction[] => {
    if (account.userId !== user.id) return [];
    const isClosed = account.status === 'CLOSED';
    const isArchived = account.status === 'ARCHIVED';
    const isCreditCard = account.type === 'CREDIT_CARD';
    const actions: DropdownAction[] = [];

    if (!isClosed) actions.push({ label: 'Editar', icon: <Pencil className="w-4 h-4" />, onClick: () => setEditingAccount(account) });
    if (!isArchived && !isClosed) actions.push({ label: 'Arquivar', icon: <Archive className="w-4 h-4" />, onClick: () => { setConfirmError(null); setConfirm({ action: 'archive', account }); } });
    if (isArchived) actions.push({ label: 'Reativar', icon: <ArchiveRestore className="w-4 h-4" />, onClick: () => { setConfirmError(null); setConfirm({ action: 'unarchive', account }); } });
    if (!isArchived && !isClosed && !isCreditCard) actions.push({ label: 'Encerrar conta', icon: <Lock className="w-4 h-4" />, onClick: () => { setConfirmError(null); setConfirm({ action: 'close', account }); }, danger: true });
    actions.push({ label: 'Excluir', icon: <Trash2 className="w-4 h-4" />, onClick: () => { setConfirmError(null); setConfirm({ action: 'delete', account }); }, danger: true });

    return actions;
  };

  const renderBankAccount = (account: Account) => {
    const associatedCardsSum = creditCards
      .filter((card) => card.associatedAccountId === account.id)
      .reduce((sum, card) => sum + (card.balance || 0), 0);
    const projectedBalance = account.balance + associatedCardsSum;
    const isClosed = account.status === 'CLOSED';
    const actions = getAccountActions(account);

    return (
      <div key={account.id} className={cn('bg-bg-surface border rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 min-h-[220px]', isClosed ? 'border-border-subtle/50 opacity-60' : 'border-border-subtle hover:border-brand/40')}>
        <div className="space-y-4 w-full">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              {getAccountIconCircle(account.type, isClosed)}
              <div>
                <h4 className="font-bold text-text-primary tracking-tight text-base">{account.name}</h4>
                <p className="text-xs text-text-secondary mt-0.5">{account.bank}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <div className="flex items-center gap-1.5">
                {isClosed ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-700/40 border border-zinc-600/30 text-zinc-400 uppercase">Encerrada</span> : <Badge status="PAID">Ativo</Badge>}
                {actions.length > 0 && <AccountActionsMenu actions={actions} />}
              </div>
              {renderMemberBadge(account)}
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <div>
              <span className="text-text-secondary text-xs font-semibold uppercase tracking-wider block">Saldo disponível</span>
              <p className={cn('text-2xl font-bold tracking-tight mt-1', account.balance < 0 ? 'text-danger' : 'text-text-primary')}>
                {formatCurrency(account.balance)}
              </p>
            </div>

            {associatedCardsSum < 0 && (
              <div className="pt-3 border-t border-border-subtle flex flex-col gap-1">
                <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider block">Saldo Projetado (Livre)</span>
                <p className={cn('text-base font-bold tracking-tight', projectedBalance < 0 ? 'text-danger' : 'text-success')}>
                  {formatCurrency(projectedBalance)}
                </p>
                <span className="text-[10px] text-text-muted">Deduzindo {formatCurrency(Math.abs(associatedCardsSum))} em faturas vinculadas</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border-subtle/50 flex items-center justify-between text-xs text-text-secondary">
          <span>Tipo:</span>
          <span className="font-semibold text-text-primary">{account.type === 'SAVINGS' ? 'Poupança' : 'Conta Corrente'}</span>
        </div>
      </div>
    );
  };

  const renderCreditCard = (card: Account) => {
    const limit = card.creditLimit || 1;
    const currentInvoice = Math.abs(card.balance);
    const usagePercent = Math.round((currentInvoice / limit) * 100);
    const barColor = usagePercent > 90 ? 'bg-danger' : usagePercent >= 70 ? 'bg-warning' : 'bg-brand';
    const payingAccount = bankAccounts.find((acc) => acc.id === card.associatedAccountId);
    const actions = getAccountActions(card);

    return (
      <div key={card.id} className="bg-bg-surface border border-border-subtle hover:border-brand/40 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 min-h-[220px]">
        <div className="space-y-4 w-full">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              {getAccountIconCircle(card.type)}
              <div>
                <h4 className="font-bold text-text-primary tracking-tight text-base">{card.name}</h4>
                <p className="text-xs text-text-secondary mt-0.5">{card.bank}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 uppercase">Crédito</span>
                {actions.length > 0 && <AccountActionsMenu actions={actions} />}
              </div>
              {renderMemberBadge(card)}
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <div>
              <span className="text-text-secondary text-xs font-semibold uppercase tracking-wider block">Fatura atual</span>
              <p className="text-2xl font-bold text-text-primary tracking-tight mt-1">
                {formatCurrency(currentInvoice)} <span className="text-sm font-normal text-text-secondary">/ {formatCurrency(card.creditLimit || 0)}</span>
              </p>
            </div>
            <div className="space-y-1.5 w-full">
              <div className="flex justify-between items-center text-[10px] text-text-secondary">
                <span>Uso do limite</span><span className="font-semibold">{usagePercent}%</span>
              </div>
              <div className="w-full bg-bg-elevated h-2 rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full transition-all duration-300', barColor)} style={{ width: `${Math.min(usagePercent, 100)}%` }} />
              </div>
              {payingAccount && (
                <p className="text-[10px] text-text-muted mt-1">Débito automático: <span className="font-medium text-text-secondary">{payingAccount.name}</span></p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border-subtle/50 flex items-center justify-between text-sm text-text-muted">
          <span>Fatura:</span>
          <span className="font-semibold text-text-secondary">Fecha dia {card.closingDay} · Vence dia {card.dueDay}</span>
        </div>
      </div>
    );
  };

  const renderArchivedCard = (account: Account) => {
    const actions = getAccountActions(account);
    const isCreditCard = account.type === 'CREDIT_CARD';
    return (
      <div key={account.id} className="bg-bg-surface/50 border border-border-subtle/50 rounded-xl p-4 flex items-center gap-4 opacity-70 hover:opacity-90 transition-all">
        {getAccountIconCircle(account.type, true)}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text-secondary text-sm truncate">{account.name}</p>
          <p className="text-xs text-text-muted truncate">{account.bank}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold text-text-secondary">{isCreditCard ? formatCurrency(Math.abs(account.balance)) : formatCurrency(account.balance)}</p>
          <p className="text-[10px] text-text-muted">{isCreditCard ? 'Fatura' : 'Saldo'}</p>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-700/40 border border-zinc-600/30 text-zinc-400 uppercase shrink-0">Arquivada</span>
        {actions.length > 0 && <AccountActionsMenu actions={actions} />}
      </div>
    );
  };

  return (
    <div className="gradient-bg min-h-screen text-white">
      {isCouple && (
        <div className="bg-violet-500/10 border-b border-violet-500/20 py-2 text-center">
          <span className="text-violet-300 text-xs font-medium">
            🫂 Você está vendo as contas do casal ({user.name} & {partnerName})
          </span>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white animate-fade-in">Contas & Cartões</h1>
            <p className="text-text-secondary text-sm mt-1">Gerencie contas bancárias e cartões de crédito</p>
          </div>
          {/* Two distinct create buttons */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => setIsBankModalOpen(true)}
              className="bg-bg-surface hover:bg-bg-elevated border border-border-subtle hover:border-violet-500/40 text-text-primary font-medium text-sm rounded-xl px-4 py-2.5 transition-all flex items-center gap-2 cursor-pointer group"
            >
              <Landmark className="w-4 h-4 text-violet-400 group-hover:text-violet-300 transition-colors" />
              <span>Nova Conta</span>
            </button>
            <button
              onClick={() => setIsCardModalOpen(true)}
              className="bg-brand hover:bg-brand-hover text-white font-medium text-sm rounded-xl px-4 py-2.5 shadow-lg shadow-brand/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Novo Cartão</span>
            </button>
          </div>
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
          <div className="space-y-12">
            {accounts.length === 0 ? (
              <div className="bg-bg-surface border border-border-subtle p-12 text-center max-w-lg mx-auto space-y-6 rounded-2xl">
                <div className="w-16 h-16 bg-bg-elevated rounded-2xl flex items-center justify-center mx-auto border border-border-subtle">
                  <Landmark className="w-8 h-8 text-text-secondary" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold">Nenhuma conta cadastrada</h3>
                  <p className="text-sm text-text-secondary">Comece adicionando uma conta corrente, poupança ou cartão de crédito.</p>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <button onClick={() => setIsBankModalOpen(true)} className="bg-bg-elevated hover:bg-bg-surface border border-border-subtle hover:border-violet-500/40 text-text-primary font-medium text-sm rounded-xl px-5 py-2.5 transition-all inline-flex items-center gap-2 cursor-pointer">
                    <Landmark className="w-4 h-4 text-violet-400" /> Nova Conta
                  </button>
                  <button onClick={() => setIsCardModalOpen(true)} className="bg-brand hover:bg-brand-hover text-white font-medium text-sm rounded-xl px-5 py-2.5 shadow-lg shadow-brand/20 transition-all inline-flex items-center gap-2 cursor-pointer">
                    <CreditCard className="w-4 h-4" /> Novo Cartão
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedActiveAccounts.map((account) =>
                    account.type === 'CREDIT_CARD' ? renderCreditCard(account) : renderBankAccount(account)
                  )}
                  {/* Phantom cards */}
                  <div className="border-2 border-dashed border-border-subtle bg-bg-surface/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 min-h-[220px]">
                    <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Adicionar</p>
                    <div className="flex flex-col gap-2 w-full max-w-[160px]">
                      <button onClick={() => setIsBankModalOpen(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border-subtle hover:border-violet-500/40 hover:bg-bg-elevated text-text-secondary hover:text-text-primary text-sm font-medium transition-all cursor-pointer group">
                        <Landmark className="w-4 h-4 text-violet-400 shrink-0" /> Nova Conta
                      </button>
                      <button onClick={() => setIsCardModalOpen(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-brand/30 hover:border-brand/60 hover:bg-brand/10 text-brand text-sm font-medium transition-all cursor-pointer">
                        <Plus className="w-4 h-4 shrink-0" /> Novo Cartão
                      </button>
                    </div>
                  </div>
                </div>

                {/* Archived Section */}
                {archivedAccounts.length > 0 && (
                  <div className="space-y-4">
                    <button onClick={() => setShowArchived((v) => !v)} className="flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer group">
                      {showArchived ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      <Archive className="w-4 h-4 text-text-muted group-hover:text-text-secondary transition-colors" />
                      Arquivadas ({archivedAccounts.length})
                    </button>
                    {showArchived && (
                      <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                        {archivedAccounts.map(renderArchivedCard)}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateBankModal open={isBankModalOpen} onClose={() => setIsBankModalOpen(false)} onCreate={createAccount} isCreating={isCreating} currency={user.currency} />
      <CreateCardModal open={isCardModalOpen} onClose={() => setIsCardModalOpen(false)} onCreate={createAccount} isCreating={isCreating} currency={user.currency} bankAccounts={bankAccounts} formatCurrency={formatCurrency} />
      <EditModal account={editingAccount} onClose={() => setEditingAccount(null)} bankAccounts={bankAccounts} currency={user.currency} />

      {confirm && (
        <ConfirmModal
          open
          title={confirmConfig[confirm.action].title}
          description={confirmConfig[confirm.action].description}
          confirmLabel={confirmConfig[confirm.action].label}
          danger={confirmConfig[confirm.action].danger}
          onConfirm={handleConfirm}
          onCancel={() => { setConfirm(null); setConfirmError(null); }}
          loading={confirmLoading}
          errorMessage={confirmError}
        />
      )}
    </div>
  );
}
