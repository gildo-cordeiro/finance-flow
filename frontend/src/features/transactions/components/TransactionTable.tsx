import { Transaction, Category, TransactionType } from '../types';
import { Account } from '../../accounts/types';
import { TransactionRow } from './TransactionRow';
import { ChevronDown, Calendar, AlertTriangle } from 'lucide-react';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../lib/cn';
import { formatCurrency } from '../../../utils/formatters';

interface TransactionTableProps {
  accounts: Account[];
  categories: Category[];
  user: { id: string; name: string } | null;
  isCouple: boolean;
  partnerName: string;
  searchMonth: string;
  isTransLoading: boolean;
  transError: Error | null;
  isSummaryLoading: boolean;
  monthSummary: { income: number; expense: number; totalCount: number } | null;
  filteredTransactions: Transaction[];
  groupedTransactions: Record<string, Transaction[]>;
  sortedMonthKeys: string[];
  expandedTransactionId: string | null;
  setExpandedTransactionId: (val: string | null) => void;
  toggleMonth: (monthKey: string) => void;
  isMonthExpanded: (monthKey: string) => boolean;
  getMonthLimit: (monthKey: string) => number;
  handleLoadMore: (monthKey: string) => void;
  handleOpenNewTrans: () => void;
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
  getMonthName: (monthKey: string) => string;
  getMonthLabelOnly: (monthKey: string) => string;
}

export function TransactionTable({
  accounts,
  categories,
  user,
  isCouple,
  partnerName,
  searchMonth,
  isTransLoading,
  transError,
  isSummaryLoading,
  monthSummary,
  filteredTransactions,
  groupedTransactions,
  sortedMonthKeys,
  expandedTransactionId,
  setExpandedTransactionId,
  toggleMonth,
  isMonthExpanded,
  getMonthLimit,
  handleLoadMore,
  handleOpenNewTrans,
  onEdit,
  onDelete,
  getMonthName,
  getMonthLabelOnly,
}: TransactionTableProps) {
  if (isTransLoading) {
    return (
      <div className="flex justify-center items-center py-20 bg-bg-surface border border-border-subtle rounded-xl">
        <div className="w-10 h-10 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (transError) {
    return (
      <div className="p-6 text-center text-red-400 space-y-2 bg-bg-surface border border-border-subtle rounded-xl">
        <AlertTriangle className="w-10 h-10 mx-auto" />
        <p>Erro ao carregar lançamentos.</p>
        <p className="text-xs text-red-400/80">{transError.message}</p>
      </div>
    );
  }

  if (filteredTransactions.length === 0) {
    return (
      <div className="bg-bg-surface border border-border-subtle rounded-xl">
        <EmptyState
          icon={<Calendar className="w-12 h-12 text-zinc-600" />}
          title="Nenhuma transação encontrada"
          description="Ajuste os filtros ou crie um novo lançamento."
          action={
            <Button onClick={handleOpenNewTrans} variant="primary" size="sm">
              Adicionar transação
            </Button>
          }
        />
      </div>
    );
  }

  if (searchMonth !== 'ALL') {
    // Single month view
    const visibleLimit = getMonthLimit(searchMonth);
    const visibleTxs = filteredTransactions.slice(0, visibleLimit);

    return (
      <div className="bg-bg-surface border border-border-subtle rounded-xl overflow-hidden">
        {isSummaryLoading ? (
          <div className="animate-pulse bg-zinc-850/60 h-14 w-full border-b border-border-subtle" />
        ) : (
          <div className="bg-bg-surface border-b border-border-subtle p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-400" />
              <span className="font-semibold text-zinc-100 text-sm">Resumo de {getMonthName(searchMonth)}</span>
            </div>
            <div className="flex items-center gap-4 flex-wrap text-xs">
              <div className="text-zinc-400">
                Total: <span className="font-semibold text-zinc-200">{monthSummary?.totalCount || 0} {monthSummary?.totalCount === 1 ? 'lançamento' : 'lançamentos'}</span>
              </div>
              <div className="text-zinc-400">
                Entradas: <span className="font-bold text-success">+{formatCurrency(monthSummary?.income || 0)}</span>
              </div>
              <div className="text-zinc-400">
                Saídas: <span className="font-bold text-danger">-{formatCurrency(monthSummary?.expense || 0)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/60 text-zinc-400 text-xs font-semibold uppercase tracking-wider bg-bg-surface/30">
                <th className="p-4">Competência</th>
                <th className="p-4">Descrição</th>
                <th className="p-4">Categoria</th>
                <th className="p-4">Conta</th>
                <th className="p-4 text-right">Valor</th>
                {isCouple && <th className="p-4">Membro</th>}
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40 text-sm text-zinc-300">
              {visibleTxs.map(t => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  accounts={accounts}
                  categories={categories}
                  user={user}
                  isCouple={isCouple}
                  partnerName={partnerName}
                  isExpanded={expandedTransactionId === t.id}
                  onToggleExpand={() => setExpandedTransactionId(expandedTransactionId === t.id ? null : t.id)}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length > visibleLimit && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-zinc-800/40 text-xs text-zinc-400 bg-bg-surface/20">
            <span>
              Exibindo {visibleTxs.length} de {filteredTransactions.length} transações em {getMonthLabelOnly(searchMonth)}
            </span>
            <button
              onClick={() => handleLoadMore(searchMonth)}
              className="text-xs text-violet-400 hover:text-violet-300 font-semibold transition-colors bg-bg-elevated/45 hover:bg-bg-elevated px-3 py-1.5 rounded-lg border border-border-subtle"
            >
              Ver mais
            </button>
          </div>
        )}
      </div>
    );
  }

  // ALL months view (collapsible grouped tables)
  return (
    <div className="space-y-4">
      {sortedMonthKeys.map(monthKey => {
        const allMonthTxs = groupedTransactions[monthKey] || [];
        const visibleLimit = getMonthLimit(monthKey);
        const visibleTxs = allMonthTxs.slice(0, visibleLimit);
        const isExpanded = isMonthExpanded(monthKey);

        const monthNet = allMonthTxs.reduce((sum, t) => {
          return sum + (t.type === TransactionType.INCOME ? t.amount : -t.amount);
        }, 0);

        return (
          <div key={monthKey} className="bg-bg-surface border border-border-subtle rounded-xl overflow-hidden">
            {/* Monthly Header */}
            <div
              onClick={() => toggleMonth(monthKey)}
              className="flex items-center justify-between p-4 bg-bg-surface hover:bg-bg-elevated/40 border-b border-border-subtle cursor-pointer transition-colors select-none"
            >
              <div className="flex items-center gap-3 flex-wrap">
                <ChevronDown className={cn("w-4 h-4 text-zinc-400 transition-transform duration-200", !isExpanded && "-rotate-90")} />
                <span className="font-semibold text-zinc-100">{getMonthName(monthKey)}</span>
                <span className="text-zinc-650 font-light">•</span>
                <span className="text-xs text-zinc-450">
                  {allMonthTxs.length} {allMonthTxs.length === 1 ? 'transação' : 'transações'}
                </span>
                <span className="text-zinc-650 font-light">•</span>
                <span className={cn(
                  "font-semibold text-xs",
                  monthNet > 0 ? "text-success" : monthNet < 0 ? "text-danger" : "text-zinc-300"
                )}>
                  {monthNet > 0 ? '+' : ''}{formatCurrency(monthNet)}
                </span>
              </div>
            </div>

            {/* Collapsible content */}
            {isExpanded && (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800/60 text-zinc-400 text-xs font-semibold uppercase tracking-wider bg-bg-surface/30">
                        <th className="p-4">Competência</th>
                        <th className="p-4">Descrição</th>
                        <th className="p-4">Categoria</th>
                        <th className="p-4">Conta</th>
                        <th className="p-4 text-right">Valor</th>
                        {isCouple && <th className="p-4">Membro</th>}
                        <th className="p-4 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/40 text-sm text-zinc-300">
                      {visibleTxs.map(t => (
                        <TransactionRow
                          key={t.id}
                          transaction={t}
                          accounts={accounts}
                          categories={categories}
                          user={user}
                          isCouple={isCouple}
                          partnerName={partnerName}
                          isExpanded={expandedTransactionId === t.id}
                          onToggleExpand={() => setExpandedTransactionId(expandedTransactionId === t.id ? null : t.id)}
                          onEdit={onEdit}
                          onDelete={onDelete}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                {allMonthTxs.length > 20 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-zinc-800/40 text-xs text-zinc-400 bg-bg-surface/20">
                    <span>
                      Exibindo {visibleTxs.length} de {allMonthTxs.length} transações em {getMonthLabelOnly(monthKey)}
                    </span>
                    {visibleTxs.length < allMonthTxs.length && (
                      <button
                        onClick={() => handleLoadMore(monthKey)}
                        className="text-xs text-violet-400 hover:text-violet-300 font-semibold transition-colors bg-bg-elevated/45 hover:bg-bg-elevated px-3 py-1.5 rounded-lg border border-border-subtle"
                      >
                        Ver mais
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
