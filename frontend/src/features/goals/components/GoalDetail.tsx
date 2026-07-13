import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Archive, ArchiveRestore, TrendingUp, CalendarCheck } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useGoal, useDeleteGoal, useDeleteContribution, useUnarchiveGoal } from '../hooks/useGoals';
import { GoalFormModal } from './GoalFormModal';
import { AddContributionModal } from './AddContributionModal';
import { GoalHeader } from './GoalHeader';
import { ContributionHistory } from './ContributionHistory';
import { useToast } from '../../../context/ToastContext';
import { formatDate, formatCurrency } from '../../../utils/formatters';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export function GoalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const { data: detail, isLoading, isError, error } = useGoal(id || '');
  const deleteGoal = useDeleteGoal();
  const deleteContribution = useDeleteContribution(id || '');
  const unarchiveGoal = useUnarchiveGoal();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddContribModalOpen, setIsAddContribModalOpen] = useState(false);

  const handleArchive = async () => {
    if (!id) return;
    if (window.confirm('Tem certeza que deseja arquivar este objetivo?')) {
      try {
        await deleteGoal.mutateAsync(id);
        toast.success('Objetivo arquivado com sucesso!');
        navigate('/goals');
      } catch (err) {
        const error = err as Error;
        toast.error(error.message || 'Erro ao arquivar objetivo.');
      }
    }
  };

  const handleUnarchive = async () => {
    if (!id) return;
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

  const handleDeleteContribution = async (contributionId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta contribuição?')) {
      try {
        await deleteContribution.mutateAsync(contributionId);
        toast.success('Contribuição excluída com sucesso!');
      } catch (err) {
        const error = err as Error;
        toast.error(error.message || 'Erro ao excluir contribuição.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !detail) {
    return (
      <div className="p-6">
        <EmptyState
          title="Erro ao carregar detalhes do objetivo"
          description={error?.message || 'Objetivo não encontrado.'}
          action={
            <Button variant="secondary" onClick={() => navigate('/goals')}>
              Voltar aos Objetivos
            </Button>
          }
        />
      </div>
    );
  }

  const { goal, contributions, projectedCompletionDate } = detail;
  const isCompleted = goal.status === 'COMPLETED' || goal.currentAmount >= goal.targetAmount;
  const hasCoupleId = !!goal.coupleId;

  // Check if deadline is in risk
  const isDeadlineInRisk =
    projectedCompletionDate &&
    new Date(projectedCompletionDate) > new Date(goal.deadline) &&
    !isCompleted;

  // Chart data generation
  const sortedContribsAsc = [...contributions].sort(
    (a, b) => new Date(a.contributionDate).getTime() - new Date(b.contributionDate).getTime()
  );

  let runningTotal = 0;
  const chartData = sortedContribsAsc.map((c) => {
    runningTotal += c.amount;
    return {
      date: formatDate(c.contributionDate).substring(0, 5), // "dd/MM"
      valor: runningTotal,
      amount: c.amount,
      note: c.note || (c.type === 'AUTOMATIC' ? 'Lançamento Automático' : 'Contribuição'),
    };
  });

  // If no contributions, add initial state
  if (chartData.length === 0) {
    chartData.push({
      date: 'Início',
      valor: 0,
      amount: 0,
      note: 'Sem contribuições',
    });
  } else {
    // Add an initial point of zero at the start
    chartData.unshift({
      date: 'Início',
      valor: 0,
      amount: 0,
      note: 'Início do objetivo',
    });
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Back link & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/goals')}
          className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors text-sm font-medium cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Objetivos
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Editar
          </Button>
          {goal.status !== 'ARCHIVED' ? (
            <Button variant="danger" onClick={handleArchive} className="flex items-center gap-2">
              <Archive className="w-4 h-4" />
              Arquivar
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={handleUnarchive}
              className="flex items-center gap-2 text-emerald-400 border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/10"
            >
              <ArchiveRestore className="w-4 h-4" />
              Desarquivar
            </Button>
          )}
        </div>
      </div>

      {/* Goal Header */}
      <GoalHeader
        goal={goal}
        isCompleted={isCompleted}
        hasCoupleId={hasCoupleId}
        isDeadlineInRisk={!!isDeadlineInRisk}
        projectedCompletionDate={projectedCompletionDate || null}
      />

      {/* Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evolution Chart */}
        <Card className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 border-b border-border-subtle pb-4">
            <TrendingUp className="w-5 h-5 text-brand" />
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
              Evolução do Saldo
            </h3>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C5CFC" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7C5CFC" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2E45" vertical={false} />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) =>
                    `R$ ${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1D27',
                    border: '1px solid #2A2E45',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#F1F5F9',
                  }}
                  formatter={(value) => [formatCurrency(Number(value)), 'Saldo Acumulado']}
                />
                <Area
                  type="monotone"
                  dataKey="valor"
                  stroke="#7C5CFC"
                  fill="url(#gradBalance)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#7C5CFC', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Projection Info */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border-subtle pb-4">
            <CalendarCheck className="w-5 h-5 text-brand" />
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
              Cronograma & Projeção
            </h3>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between py-2 border-b border-white/[0.04]">
              <span className="text-text-secondary">Data de Início:</span>
              <span className="text-text-primary font-medium">
                {formatDate(goal.createdAt.substring(0, 10))}
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-white/[0.04]">
              <span className="text-text-secondary">Prazo Estipulado:</span>
              <span className="text-text-primary font-medium">{formatDate(goal.deadline)}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-white/[0.04]">
              <span className="text-text-secondary">Data Projetada:</span>
              <span className="text-text-primary font-medium">
                {projectedCompletionDate ? formatDate(projectedCompletionDate) : 'Indefinida'}
              </span>
            </div>

            {projectedCompletionDate && (
              <div className="p-3 bg-bg-elevated rounded-xl space-y-1 text-center">
                <span className="text-text-secondary text-xs">Ritmo de Poupança Estimado</span>
                <p className="text-text-primary font-bold text-base">
                  {contributions.length > 0
                    ? `Média de R$ ${(
                        contributions.reduce((acc, c) => acc + c.amount, 0) /
                        Math.max(1, contributions.length)
                      ).toFixed(2)} por aporte`
                    : 'Sem histórico'}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Contributions History */}
      <ContributionHistory
        contributions={contributions}
        onDeleteContribution={handleDeleteContribution}
        onAddContributionClick={() => setIsAddContribModalOpen(true)}
      />

      {/* Edit Goal Modal */}
      <GoalFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        editingGoal={goal}
      />

      {/* Add Contribution Modal */}
      <AddContributionModal
        isOpen={isAddContribModalOpen}
        onClose={() => setIsAddContribModalOpen(false)}
        goalId={id || ''}
      />
    </div>
  );
}
