import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Target, Calendar, Edit2, Archive, ArchiveRestore } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { MoneyValue } from '../../../components/ui/MoneyValue';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useGoals, useDeleteGoal, useUnarchiveGoal } from '../hooks/useGoals';
import { GoalFormModal } from './GoalFormModal';
import { Goal } from '../types';
import { useToast } from '../../../context/ToastContext';
import { formatDate } from '../../../utils/formatters';

export function Goals() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: goals, isLoading, isError, error } = useGoals();
  const deleteGoal = useDeleteGoal();
  const unarchiveGoal = useUnarchiveGoal();

  const [filterStatus, setFilterStatus] = useState<'ACTIVE' | 'COMPLETED' | 'ARCHIVED'>(() => {
    const saved = sessionStorage.getItem('goals_filter_status');
    return (saved as 'ACTIVE' | 'COMPLETED' | 'ARCHIVED') || 'ACTIVE';
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const handleOpenCreate = () => {
    setEditingGoal(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (goal: Goal, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const handleArchive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja arquivar este objetivo?')) {
      try {
        await deleteGoal.mutateAsync(id);
        toast.success('Objetivo arquivado com sucesso!');
      } catch (err) {
        const error = err as Error;
        toast.error(error.message || 'Erro ao arquivar objetivo.');
      }
    }
  };

  const handleUnarchive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja desarquivar este objetivo?')) {
      try {
        await unarchiveGoal.mutateAsync(id);
        toast.success('Objetivo desarquivado com sucesso!');
      } catch (err) {
        const error = err as Error;
        toast.error(error.message || 'Erro ao desarquivar objetivo.');
      }
    }
  };

  const handleFilterChange = (status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED') => {
    setFilterStatus(status);
    sessionStorage.setItem('goals_filter_status', status);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <EmptyState
          title="Erro ao carregar objetivos"
          description={error?.message}
          action={<Button variant="secondary" onClick={() => window.location.reload()}>Tentar novamente</Button>}
        />
      </div>
    );
  }

  const filteredGoals = goals?.filter((goal) => goal.status === filterStatus) || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Target className="w-6 h-6 text-brand" />
            Objetivos Financeiros
          </h1>
          <p className="text-text-secondary text-sm">
            Planeje, acompanhe e realize suas metas de médio e longo prazo.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Objetivo
        </Button>
      </div>

      {/* Tabs / Filters */}
      <div className="flex bg-bg-surface border border-border-subtle p-1 rounded-xl shadow-lg max-w-md">
        <button
          onClick={() => handleFilterChange('ACTIVE')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
            filterStatus === 'ACTIVE'
              ? 'bg-brand text-white'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          Em Andamento
        </button>
        <button
          onClick={() => handleFilterChange('COMPLETED')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
            filterStatus === 'COMPLETED'
              ? 'bg-brand text-white'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          Concluídos
        </button>
        <button
          onClick={() => handleFilterChange('ARCHIVED')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
            filterStatus === 'ARCHIVED'
              ? 'bg-brand text-white'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          Arquivados
        </button>
      </div>

      {/* Goals List */}
      {filteredGoals.length === 0 ? (
        <EmptyState
          title={`Nenhum objetivo ${
            filterStatus === 'ACTIVE'
              ? 'em andamento'
              : filterStatus === 'COMPLETED'
              ? 'concluído'
              : 'arquivado'
          }`}
          description={
            filterStatus === 'ACTIVE'
              ? 'Comece agora criando seu primeiro objetivo de poupança!'
              : ''
          }
          action={
            filterStatus === 'ACTIVE' ? (
              <Button variant="secondary" onClick={handleOpenCreate}>
                Criar Objetivo
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-350">
          {filteredGoals.map((goal) => {
            const hasCoupleId = !!goal.coupleId;

            return (
              <Card
                key={goal.id}
                onClick={() => navigate(`/goals/${goal.id}`)}
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
                        <p className="text-text-secondary text-xs line-clamp-1">
                          {goal.description}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                        hasCoupleId
                          ? 'bg-pink-500/10 text-pink-400 border-pink-500/20'
                          : 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                      }`}
                    >
                      {hasCoupleId ? 'Casal' : 'Individual'}
                    </span>
                  </div>

                  {/* Amounts */}
                  <div className="flex justify-between items-baseline pt-1">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-text-muted uppercase tracking-wider block">
                        Poupança Atual
                      </span>
                      <MoneyValue amount={goal.currentAmount} showSign={false} className="text-lg font-bold" />
                    </div>
                    <div className="text-right space-y-0.5">
                      <span className="text-[10px] text-text-muted uppercase tracking-wider block">
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
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-text-muted" />
                    <span>Prazo: {formatDate(goal.deadline)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={(e) => handleOpenEdit(goal, e)}
                      className="p-1 text-text-secondary hover:text-white rounded hover:bg-bg-elevated transition-colors"
                      title="Editar objetivo"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {goal.status !== 'ARCHIVED' ? (
                      <button
                        onClick={(e) => handleArchive(goal.id, e)}
                        className="p-1 text-text-secondary hover:text-danger rounded hover:bg-danger/10 transition-colors"
                        title="Arquivar objetivo"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleUnarchive(goal.id, e)}
                        className="p-1 text-text-secondary hover:text-emerald-400 rounded hover:bg-emerald-500/10 transition-colors"
                        title="Desarquivar objetivo"
                      >
                        <ArchiveRestore className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      <GoalFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingGoal={editingGoal}
      />
    </div>
  );
}
