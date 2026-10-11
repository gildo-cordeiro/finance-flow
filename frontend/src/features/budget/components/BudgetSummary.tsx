import { TrendingUp, Wallet, PiggyBank } from 'lucide-react';
import { cn } from '../../../lib/cn';
import { MoneyValue } from '../../../components/ui/MoneyValue';

interface BudgetSummaryProps {
  totalPlanned: number;
  totalRealized: number;
  totalRemaining: number;
  currency: string;
}

export function BudgetSummary({
  totalPlanned,
  totalRealized,
  totalRemaining,
  currency,
}: BudgetSummaryProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL',
    }).format(val);
  };

  const usagePercent = totalPlanned > 0 ? Math.round((totalRealized / totalPlanned) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in duration-300">
      <div className="auth-card p-6 flex items-start gap-4">
        <div className="p-3 bg-violet-500/10 text-violet-400 rounded-xl">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-text-label text-[13px] font-semibold">Total Planejado</h3>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalPlanned)}</p>
        </div>
      </div>

      <div className="auth-card p-6 flex items-start gap-4">
        <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
          <Wallet className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-text-label text-[13px] font-semibold">Total Realizado</h3>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalRealized)}</p>
        </div>
      </div>

      <div className="auth-card p-6 flex items-start gap-4">
        <div
          className={`p-3 rounded-xl ${
            totalRemaining >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          }`}
        >
          <PiggyBank className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-text-label text-[13px] font-semibold">Saldo Restante</h3>
          <MoneyValue amount={totalRemaining} variant="auto" className="text-2xl font-bold mt-1 block" />
        </div>
      </div>

      <div className="auth-card p-6 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <h3 className="text-text-label text-[13px] font-semibold">Utilização Geral</h3>
          <span
            className={cn(
              'text-xs font-bold px-2 py-0.5 rounded-full select-none border',
              totalPlanned > 0 && totalRealized / totalPlanned > 1
                ? 'bg-danger/10 text-danger border-danger/20'
                : totalPlanned > 0 && totalRealized / totalPlanned >= 0.8
                ? 'bg-warning/10 text-warning border-warning/20'
                : 'bg-success/10 text-success border-success/20'
            )}
          >
            {usagePercent}%
          </span>
        </div>
        <div className="mt-3.5 w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              totalPlanned > 0 && totalRealized / totalPlanned > 1
                ? 'bg-danger'
                : totalPlanned > 0 && totalRealized / totalPlanned >= 0.8
                ? 'bg-warning'
                : 'bg-success'
            )}
            style={{ width: `${Math.min(usagePercent, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
