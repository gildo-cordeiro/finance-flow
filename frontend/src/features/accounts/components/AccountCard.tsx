import { useState, useRef, useEffect } from 'react';
import {
  Landmark,
  PiggyBank,
  CreditCard as CreditCardIcon,
  HelpCircle,
  MoreVertical,
} from 'lucide-react';
import { cn } from '../../../lib/cn';
import { Badge } from '../../../components/ui/Badge';
import type { Account, AccountType } from '../types';

export type DropdownAction = {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
};

interface AccountActionsMenuProps {
  actions: DropdownAction[];
}

export function AccountActionsMenu({ actions }: AccountActionsMenuProps) {
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
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
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
              onClick={() => {
                action.onClick();
                setOpen(false);
              }}
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

interface AccountCardProps {
  account: Account;
  actions: DropdownAction[];
  currency: string;
  isCouple: boolean;
  partnerName: string;
  currentUserId: string;
  associatedCardsSum?: number; // for bank accounts
  payingAccountName?: string; // for credit cards
}

export function AccountCard({
  account,
  actions,
  currency,
  isCouple,
  partnerName,
  currentUserId,
  associatedCardsSum = 0,
  payingAccountName,
}: AccountCardProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(val);

  const getAccountIconCircle = (type: AccountType, muted = false) => {
    const iconClasses = muted
      ? 'bg-zinc-800/50 text-zinc-500 border-zinc-700/30'
      : {
          CHECKING: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
          SAVINGS: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          CREDIT_CARD: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        }[type] || 'bg-zinc-800 text-zinc-400 border-zinc-700/50';

    const icon =
      {
        CHECKING: <Landmark className="w-5 h-5" />,
        SAVINGS: <PiggyBank className="w-5 h-5" />,
        CREDIT_CARD: <CreditCardIcon className="w-5 h-5" />,
      }[type] || <HelpCircle className="w-5 h-5" />;

    return (
      <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center border shrink-0',
          iconClasses
        )}
      >
        {icon}
      </div>
    );
  };

  const renderMemberBadge = () => {
    if (!isCouple) return null;
    const isOwn = account.userId === currentUserId;
    return (
      <span
        className={cn(
          'text-xs font-bold px-2 py-0.5 rounded-md border',
          isOwn
            ? 'bg-violet-500/10 border-violet-500/20 text-violet-300'
            : 'bg-pink-500/10 border-pink-500/20 text-pink-300'
        )}
      >
        {isOwn ? 'Você' : partnerName}
      </span>
    );
  };

  const isClosed = account.status === 'CLOSED';
  const isArchived = account.status === 'ARCHIVED';

  if (isArchived) {
    const isCreditCard = account.type === 'CREDIT_CARD';
    return (
      <div className="bg-bg-surface/50 border border-border-subtle/50 rounded-xl p-4 flex items-center gap-4 opacity-70 hover:opacity-90 transition-all">
        {getAccountIconCircle(account.type, true)}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text-secondary text-sm truncate">{account.name}</p>
          <p className="text-xs text-text-muted truncate">{account.bank}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold text-text-secondary">
            {isCreditCard ? formatCurrency(Math.abs(account.balance)) : formatCurrency(account.balance)}
          </p>
          <p className="text-xs text-text-muted">{isCreditCard ? 'Fatura' : 'Saldo'}</p>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-zinc-700/40 border border-zinc-600/30 text-zinc-400 uppercase shrink-0">
          Arquivada
        </span>
        {actions.length > 0 && <AccountActionsMenu actions={actions} />}
      </div>
    );
  }

  if (account.type === 'CREDIT_CARD') {
    const limit = account.creditLimit || 1;
    const currentInvoice = Math.abs(account.balance);
    const usagePercent = Math.round((currentInvoice / limit) * 100);
    const barColor = usagePercent > 90 ? 'bg-danger' : usagePercent >= 70 ? 'bg-warning' : 'bg-brand';

    return (
      <div className="bg-bg-surface border border-border-subtle hover:border-brand/40 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 min-h-[220px]">
        <div className="space-y-4 w-full">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              {getAccountIconCircle(account.type)}
              <div>
                <h4 className="font-bold text-text-primary tracking-tight text-base">
                  {account.name}
                </h4>
                <p className="text-xs text-text-secondary mt-0.5">{account.bank}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 uppercase">
                  Crédito
                </span>
                {actions.length > 0 && <AccountActionsMenu actions={actions} />}
              </div>
              {renderMemberBadge()}
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <div>
              <span className="text-text-label text-[13px] font-semibold block">
                Fatura atual
              </span>
              <p className="text-2xl font-bold text-text-primary tracking-tight mt-1">
                {formatCurrency(currentInvoice)}{' '}
                <span className="text-sm font-normal text-text-secondary">
                  / {formatCurrency(account.creditLimit || 0)}
                </span>
              </p>
            </div>
            <div className="space-y-1.5 w-full">
              <div className="flex justify-between items-center text-xs text-text-secondary">
                <span>Uso do limite</span>
                <span className="font-semibold">{usagePercent}%</span>
              </div>
              <div className="w-full bg-bg-elevated h-2 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-300', barColor)}
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>
              {payingAccountName && (
                <p className="text-xs text-text-muted mt-1">
                  Débito automático:{' '}
                  <span className="font-medium text-text-secondary">{payingAccountName}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border-subtle/50 flex items-center justify-between text-sm text-text-muted">
          <span>Fatura:</span>
          <span className="font-semibold text-text-secondary">
            Fecha dia {account.closingDay} · Vence dia {account.dueDay}
          </span>
        </div>
      </div>
    );
  }

  // CHECKING or SAVINGS
  const projectedBalance = account.balance + associatedCardsSum;

  return (
    <div
      className={cn(
        'bg-bg-surface border rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 min-h-[220px]',
        isClosed
          ? 'border-border-subtle/50 opacity-60'
          : 'border-border-subtle hover:border-brand/40'
      )}
    >
      <div className="space-y-4 w-full">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            {getAccountIconCircle(account.type, isClosed)}
            <div>
              <h4 className="font-bold text-text-primary tracking-tight text-base">
                {account.name}
              </h4>
              <p className="text-xs text-text-secondary mt-0.5">{account.bank}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex items-center gap-1.5">
              {isClosed ? (
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-zinc-700/40 border border-zinc-600/30 text-zinc-400 uppercase">
                  Encerrada
                </span>
              ) : (
                <Badge status="PAID">Ativo</Badge>
              )}
              {actions.length > 0 && <AccountActionsMenu actions={actions} />}
            </div>
            {renderMemberBadge()}
          </div>
        </div>

        <div className="pt-2 space-y-3">
          <div>
            <span className="text-text-label text-[13px] font-semibold block">
              Saldo disponível
            </span>
            <p
              className={cn(
                'text-2xl font-bold tracking-tight mt-1',
                account.balance < 0 ? 'text-danger' : 'text-text-primary'
              )}
            >
              {formatCurrency(account.balance)}
            </p>
          </div>

          {associatedCardsSum < 0 && (
            <div className="pt-3 border-t border-border-subtle flex flex-col gap-1">
              <span className="text-text-label text-[13px] font-semibold block">
                Saldo Projetado (Livre)
              </span>
              <p
                className={cn(
                  'text-base font-bold tracking-tight',
                  projectedBalance < 0 ? 'text-danger' : 'text-success'
                )}
              >
                {formatCurrency(projectedBalance)}
              </p>
              <span className="text-xs text-text-muted">
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
}
