import { Card } from '../../../components/ui/Card';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { MoneyValue } from '../../../components/ui/MoneyValue';
import type { DashboardSummary } from '../types';

interface BudgetProgressListProps {
  summary: DashboardSummary;
}

export function BudgetProgressList({ summary }: BudgetProgressListProps) {
  const planned = summary.budgetPlanned || 0;
  const realized = summary.budgetRealized || 0;
  const hasBudget = planned > 0;

  return (
    <Card className="p-6 flex flex-col justify-between h-96">
      <div className="space-y-1">
        <h3 className="text-xl font-bold tracking-tight">Limite de Orçamento</h3>
        <p className="text-zinc-400 text-xs mt-1">Acompanhamento do teto de gastos do mês.</p>
      </div>

      <div className="flex-1 flex flex-col justify-center space-y-6 mt-4">
        {!hasBudget ? (
          <div className="text-center text-zinc-500 text-sm space-y-3">
            <p>Nenhum orçamento configurado para este mês.</p>
          </div>
        ) : (
          <div className="space-y-5 w-full">
            <div className="flex justify-between items-end border-b border-border-subtle/50 pb-3">
              <div>
                <p className="text-xs text-text-secondary uppercase font-semibold">Total Consumido</p>
                <p className="text-2xl font-extrabold text-white mt-1">
                  <MoneyValue amount={realized} showSign={false} className="text-white font-bold" />
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-text-secondary uppercase font-semibold">Teto Planejado</p>
                <p className="text-lg font-bold text-text-secondary mt-1">
                  <MoneyValue amount={planned} showSign={false} className="text-text-secondary font-bold" />
                </p>
              </div>
            </div>

            <ProgressBar value={realized} max={planned} />

            <div className="text-xs text-text-secondary text-center">
              {realized > planned ? (
                <span className="text-danger font-medium">Você ultrapassou o orçamento planejado!</span>
              ) : (
                <span>Você consumiu {Math.round((realized / planned) * 100)}% do seu limite planejado.</span>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
