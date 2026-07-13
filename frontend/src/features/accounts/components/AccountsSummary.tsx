import { Landmark, CreditCard, Shield } from 'lucide-react';
import type { Account } from '../types';

interface AccountsSummaryProps {
  accounts: Account[];
  currency: string;
}

export function AccountsSummary({ accounts, currency }: AccountsSummaryProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(val);

  const activeAccounts = accounts.filter((a) => a.status === 'ACTIVE' || a.status === 'CLOSED');
  const bankAccounts = activeAccounts.filter((acc) => acc.type === 'CHECKING' || acc.type === 'SAVINGS');
  const creditCards = activeAccounts.filter((acc) => acc.type === 'CREDIT_CARD');

  const totalBalance = bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalInvoice = creditCards.reduce((sum, card) => sum + Math.abs(card.balance), 0);
  const totalLimit = creditCards.reduce((sum, card) => sum + (card.creditLimit || 0), 0);
  const availableLimit = totalLimit - totalInvoice;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Saldo Geral */}
      <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6 flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Saldo Disponível Geral
          </p>
          <p className="text-2xl font-extrabold text-text-primary tracking-tight">
            {formatCurrency(totalBalance)}
          </p>
          <p className="text-xs text-text-muted">
            Soma de {bankAccounts.length} conta{bankAccounts.length === 1 ? '' : 's'} bancária
            {bankAccounts.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <Landmark className="w-5 h-5 text-violet-400" />
        </div>
      </div>

      {/* Fatura Total */}
      <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6 flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Faturas em Aberto
          </p>
          <p className="text-2xl font-extrabold text-danger tracking-tight">
            {formatCurrency(totalInvoice)}
          </p>
          <p className="text-xs text-text-muted">
            Em {creditCards.length} cartão{creditCards.length === 1 ? '' : 'ões'} de crédito
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-red-400" />
        </div>
      </div>

      {/* Limite de Crédito Disponível */}
      <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6 flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Limite de Crédito Disponível
          </p>
          <p className="text-2xl font-extrabold text-success tracking-tight">
            {formatCurrency(availableLimit)}
          </p>
          <p className="text-xs text-text-muted">
            De um limite total de {formatCurrency(totalLimit)}
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <Shield className="w-5 h-5 text-emerald-400" />
        </div>
      </div>
    </div>
  );
}
