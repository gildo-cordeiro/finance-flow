import { Target, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { MoneyValue } from '../../../components/ui/MoneyValue';
import { formatDate } from '../../../utils/formatters';
import type { Goal } from '../types';
import { getGoalDeadlineStatus } from '../utils/goalStatus';

interface GoalHeaderProps {
  goal: Goal;
  isCompleted: boolean;
  hasCoupleId: boolean;
  isDeadlineInRisk: boolean;
  projectedCompletionDate: string | null;
}

export function GoalHeader({
  goal,
  isCompleted,
  hasCoupleId,
  isDeadlineInRisk,
  projectedCompletionDate,
}: GoalHeaderProps) {
  const deadlineStatus = getGoalDeadlineStatus(goal);

  return (
    <div className="space-y-6">
      {/* Main Info Card */}
      <Card className="relative overflow-hidden border-brand/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  {goal.name}
                  {isCompleted && (
                    <CheckCircle2 className="w-5 h-5 text-success fill-success/10 animate-bounce" />
                  )}
                </h1>
                <p className="text-text-secondary text-sm">
                  {goal.description || 'Sem descrição cadastrada.'}
                </p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 pt-2">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                  isCompleted
                    ? 'bg-success/10 text-success border-success/20'
                    : goal.status === 'ARCHIVED'
                    ? 'bg-zinc-800 text-zinc-400 border-zinc-700/50'
                    : deadlineStatus.badge
                    ? deadlineStatus.badge.classes
                    : 'bg-info/10 text-info border-info/20'
                }`}
              >
                {isCompleted
                  ? 'Concluído'
                  : goal.status === 'ARCHIVED'
                  ? 'Arquivado'
                  : deadlineStatus.badge
                  ? deadlineStatus.badge.label
                  : 'Em Andamento'}
              </span>

              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                  hasCoupleId
                    ? 'bg-pink-500/10 text-pink-400 border-pink-500/20'
                    : 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                }`}
              >
                {hasCoupleId ? 'Objetivo do Casal' : 'Objetivo Individual'}
              </span>
            </div>
          </div>

          {/* Money Info */}
          <div className="grid grid-cols-2 md:flex md:flex-col justify-end gap-4 text-right">
            <div>
              <span className="text-[13px] font-semibold text-text-label block">
                Progresso Atual
              </span>
              <MoneyValue amount={goal.currentAmount} showSign={false} className="text-2xl font-bold" />
            </div>
            <div>
              <span className="text-[13px] font-semibold text-text-label block">
                Meta Total
              </span>
              <span className="text-sm font-semibold text-text-secondary">
                R$ {goal.targetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <ProgressBar value={goal.currentAmount} max={goal.targetAmount} />
        </div>
      </Card>

      {/* Projection alerts */}
      {isDeadlineInRisk && (
        <div className="flex items-start gap-3 p-4 bg-danger/10 border border-danger/25 text-danger rounded-xl animate-in slide-in-from-top-2 duration-300">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Prazo de Conclusão em Risco!</h4>
            <p className="text-xs text-danger/95 mt-1">
              No ritmo atual (média dos últimos 3 meses), a meta só será atingida em{' '}
              <span className="font-semibold">{formatDate(projectedCompletionDate || '')}</span>. O prazo
              planejado é <span className="font-semibold">{formatDate(goal.deadline)}</span>. Considere
              aumentar o valor das contribuições mensais.
            </p>
          </div>
        </div>
      )}

      {isCompleted && (
        <div className="flex items-start gap-3 p-4 bg-success/10 border border-success/25 text-success rounded-xl animate-in slide-in-from-top-2 duration-300">
          <Sparkles className="w-5 h-5 shrink-0 mt-0.5 text-success" />
          <div>
            <h4 className="font-semibold text-sm">Parabéns! Objetivo Alcançado!</h4>
            <p className="text-xs text-success/95 mt-1">
              Você completou a meta de poupança! Todo o valor de{' '}
              <span className="font-semibold">R$ {goal.targetAmount.toLocaleString('pt-BR')}</span> foi
              acumulado com sucesso.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
