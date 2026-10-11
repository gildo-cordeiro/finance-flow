import React from 'react';
import { Calendar, Edit2, Archive, ArchiveRestore } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { MoneyValue } from '../../../components/ui/MoneyValue';
import { formatDate } from '../../../utils/formatters';
import type { Goal } from '../types';
import { getGoalDeadlineStatus } from '../utils/goalStatus';

interface GoalCardProps {
  goal: Goal;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onArchive: (e: React.MouseEvent) => void;
  onUnarchive: (e: React.MouseEvent) => void;
}

export function GoalCard({ goal, onClick, onEdit, onArchive, onUnarchive }: GoalCardProps) {
  const hasCoupleId = !!goal.coupleId;
  const deadlineStatus = getGoalDeadlineStatus(goal);

  return (
    <Card
      onClick={onClick}
      className="hover:border-brand/40 transition-all duration-300 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
    >
      {/* Background glow decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full blur-2xl group-hover:bg-brand/10 transition-all duration-300 pointer-events-none" />

      <div className="space-y-4">
        {/* Title and Badge */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="font-semibold text-text-primary text-base group-hover:text-brand transition-colors">
              {goal.name}
            </h3>
            {goal.description && (
              <p className="text-text-secondary text-xs line-clamp-1">{goal.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {deadlineStatus.badge && (
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${deadlineStatus.badge.classes}`}
              >
                {deadlineStatus.badge.label}
              </span>
            )}
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                hasCoupleId
                  ? 'bg-pink-500/10 text-pink-400 border-pink-500/20'
                  : 'bg-violet-500/10 text-violet-400 border-violet-500/20'
              }`}
            >
              {hasCoupleId ? 'Casal' : 'Individual'}
            </span>
          </div>
        </div>

        {/* Amounts */}
        <div className="flex justify-between items-baseline pt-1">
          <div className="space-y-0.5">
            <span className="text-[13px] font-semibold text-text-label block">
              Poupança Atual
            </span>
            <MoneyValue amount={goal.currentAmount} showSign={false} className="text-lg font-bold" />
          </div>
          <div className="text-right space-y-0.5">
            <span className="text-[13px] font-semibold text-text-label block">
              Valor-Alvo
            </span>
            <span className="text-sm font-semibold text-text-secondary">
              R$ {goal.targetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <ProgressBar value={goal.currentAmount} max={goal.targetAmount} />
      </div>

      {/* Footer Info & Actions */}
      <div className="mt-6 pt-4 border-t border-border-subtle flex items-center justify-between text-text-secondary text-xs">
        <div className={`flex items-center gap-1.5 ${deadlineStatus.isOverdue ? 'text-red-300' : ''}`}>
          <Calendar className={`w-3.5 h-3.5 ${deadlineStatus.isOverdue ? 'text-red-300' : 'text-text-muted'}`} />
          <span className={deadlineStatus.isOverdue ? 'text-red-300' : ''}>
            Prazo: <span className={deadlineStatus.isOverdue ? 'text-red-300' : ''}>{formatDate(goal.deadline)}</span>
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={onEdit}
            className="p-1 text-text-secondary hover:text-white rounded hover:bg-bg-elevated transition-colors cursor-pointer"
            title="Editar objetivo"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          {goal.status !== 'ARCHIVED' ? (
            <button
              onClick={onArchive}
              className="p-1 text-text-secondary hover:text-danger rounded hover:bg-danger/10 transition-colors cursor-pointer"
              title="Arquivar objetivo"
            >
              <Archive className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onUnarchive}
              className="p-1 text-text-secondary hover:text-emerald-400 rounded hover:bg-emerald-500/10 transition-colors cursor-pointer"
              title="Desarquivar objetivo"
            >
              <ArchiveRestore className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
