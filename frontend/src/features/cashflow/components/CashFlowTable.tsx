import { useState } from 'react';
import { cn } from '../../../lib/cn';
import { CashFlowRow } from './CashFlowRow';
import type { CashFlowDailyPoint } from '../types';

interface CashFlowTableProps {
  dailyPoints: CashFlowDailyPoint[];
  weeklyData: Array<{ date: string; income: number; expense: number; lastBalance: number }>;
  monthlyData: Array<{ date: string; income: number; expense: number; lastBalance: number }>;
  formatDateDisplay: (dateStr: string) => string;
}

export function CashFlowTable({
  dailyPoints,
  weeklyData,
  monthlyData,
  formatDateDisplay,
}: CashFlowTableProps) {
  const [tableGroup, setTableGroup] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const formatMonthlyDisplay = (monthStr: string) => {
    const [yr, mn] = monthStr.split('-');
    const dateObj = new Date(Number(yr), Number(mn) - 1, 1);
    const formattedMonth = dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return formattedMonth.replace(/^\w/, (c) => c.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Granularity controls */}
      <div className="flex bg-bg-surface p-1 rounded-xl border border-border-subtle max-w-xs shadow-lg">
        <button
          onClick={() => setTableGroup('daily')}
          className={cn(
            'flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
            tableGroup === 'daily'
              ? 'bg-bg-elevated text-white'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          Diário
        </button>
        <button
          onClick={() => setTableGroup('weekly')}
          className={cn(
            'flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
            tableGroup === 'weekly'
              ? 'bg-bg-elevated text-white'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          Semanal
        </button>
        <button
          onClick={() => setTableGroup('monthly')}
          className={cn(
            'flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
            tableGroup === 'monthly'
              ? 'bg-bg-elevated text-white'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          Mensal
        </button>
      </div>

      {/* Table */}
      <div className="bg-bg-surface rounded-2xl border border-border-subtle overflow-hidden shadow-lg animate-in fade-in duration-300">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-bg-elevated/40 border-b border-border-subtle text-text-secondary text-xs font-semibold">
              <th className="p-4">Período / Data</th>
              <th className="p-4 text-right">Entradas</th>
              <th className="p-4 text-right">Saídas</th>
              <th className="p-4 text-right">Saldo Final do Período</th>
              <th className="p-4 text-center">Status de Caixa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/50 text-sm">
            {tableGroup === 'daily' &&
              dailyPoints.map((point, idx) => (
                <CashFlowRow
                  key={idx}
                  type="daily"
                  dateDisplay={formatDateDisplay(point.date)}
                  income={point.income}
                  expense={point.expense}
                  balance={point.consolidatedBalance}
                  
                />
              ))}

            {tableGroup === 'weekly' &&
              weeklyData.map((week, idx) => (
                <CashFlowRow
                  key={idx}
                  type="weekly"
                  dateDisplay={formatDateDisplay(week.date)}
                  income={week.income}
                  expense={week.expense}
                  balance={week.lastBalance}
                  
                />
              ))}

            {tableGroup === 'monthly' &&
              monthlyData.map((month, idx) => (
                <CashFlowRow
                  key={idx}
                  type="monthly"
                  dateDisplay={formatMonthlyDisplay(month.date)}
                  income={month.income}
                  expense={month.expense}
                  balance={month.lastBalance}
                  
                />
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
