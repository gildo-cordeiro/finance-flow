import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Target } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useGoals, useDeleteGoal, useUnarchiveGoal } from '../hooks/useGoals';
import { GoalFormModal } from './GoalFormModal';
import { GoalCard } from './GoalCard';
import { Goal } from '../types';
import { useToast } from '../../../context/ToastContext';

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
          action={
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          }
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
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            filterStatus === 'ACTIVE'
              ? 'bg-brand text-white'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          Em Andamento
        </button>
        <button
          onClick={() => handleFilterChange('COMPLETED')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            filterStatus === 'COMPLETED'
              ? 'bg-brand text-white'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          Concluídos
        </button>
        <button
          onClick={() => handleFilterChange('ARCHIVED')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onClick={() => navigate(`/goals/${goal.id}`)}
              onEdit={(e) => handleOpenEdit(goal, e)}
              onArchive={(e) => handleArchive(goal.id, e)}
              onUnarchive={(e) => handleUnarchive(goal.id, e)}
            />
          ))}
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
