import { ArrowUpRight, ArrowDownRight, Activity, TrendingDown } from 'lucide-react';
import { cn } from '../../../lib/cn';
import { MoneyValue } from '../../../components/ui/MoneyValue';

interface CashFlowSummaryProps {
  summaryStats: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
  };
  largestExpense: {
    amount: number;
    description: string;
  } | null;
  currency: string;
}

export function CashFlowSummary({ summaryStats, largestExpense, currency }: CashFlowSummaryProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL',
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-300">
      {/* Total Receitas */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-text-secondary text-xs font-medium">Receitas do Mês</span>
          <MoneyValue
            amount={summaryStats.totalIncome}
            variant="income"
            showSign={false}
            className="text-2xl font-bold tracking-tight"
          />
        </div>
        <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success">
          <ArrowUpRight className="w-5 h-5" />
        </div>
      </div>

      {/* Total Despesas */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-text-secondary text-xs font-medium">Despesas do Mês</span>
          <MoneyValue
            amount={summaryStats.totalExpense}
            variant="expense"
            showSign={false}
            className="text-2xl font-bold tracking-tight"
          />
        </div>
        <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center text-danger">
          <ArrowDownRight className="w-5 h-5" />
        </div>
      </div>

      {/* Saldo */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-text-secondary text-xs font-medium">Saldo do Mês</span>
          <MoneyValue
            amount={summaryStats.balance}
            variant="auto"
            className="text-2xl font-bold tracking-tight"
          />
        </div>
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            summaryStats.balance >= 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
          )}
        >
          <Activity className="w-5 h-5" />
        </div>
      </div>

      {/* Maior Despesa */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 flex items-center justify-between">
        <div className="space-y-1 min-w-0 flex-1 mr-2">
          <span className="text-text-secondary text-xs font-medium">Maior Despesa</span>
          <h3 className="text-2xl font-bold tracking-tight text-text-primary truncate">
            {largestExpense ? formatCurrency(largestExpense.amount) : formatCurrency(0)}
          </h3>
          {largestExpense && (
            <p
              className="text-xs text-text-secondary truncate max-w-full"
              title={largestExpense.description}
            >
              {largestExpense.description}
            </p>
          )}
        </div>
        <div className="w-10 h-10 rounded-xl bg-bg-elevated flex items-center justify-center text-text-secondary shrink-0">
          <TrendingDown className="w-5 h-5 text-danger" />
        </div>
      </div>
    </div>
  );
}
