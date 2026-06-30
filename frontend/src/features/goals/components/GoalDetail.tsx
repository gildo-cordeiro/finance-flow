import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Target, CalendarCheck, Edit2, Archive, ArchiveRestore, Plus,
  Trash2, AlertTriangle, TrendingUp, Sparkles, CheckCircle2
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { MoneyValue } from '../../../components/ui/MoneyValue';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useGoal, useDeleteGoal, useDeleteContribution, useUnarchiveGoal } from '../hooks/useGoals';
import { GoalFormModal } from './GoalFormModal';
import { AddContributionModal } from './AddContributionModal';
import { useToast } from '../../../context/ToastContext';
import { formatDate, formatCurrency } from '../../../utils/formatters';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';

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
      } catch (err: any) {
        toast.error(err.message || 'Erro ao arquivar objetivo.');
      }
    }
  };

  const handleUnarchive = async () => {
    if (!id) return;
    if (window.confirm('Tem certeza que deseja desarquivar este objetivo?')) {
      try {
        await unarchiveGoal.mutateAsync(id);
        toast.success('Objetivo desarquivado com sucesso!');
      } catch (err: any) {
        toast.error(err.message || 'Erro ao desarquivar objetivo.');
      }
    }
  };

  const handleDeleteContribution = async (contributionId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta contribuição?')) {
      try {
        await deleteContribution.mutateAsync(contributionId);
        toast.success('Contribuição excluída com sucesso!');
      } catch (err: any) {
        toast.error(err.message || 'Erro ao excluir contribuição.');
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
          action={<Button variant="secondary" onClick={() => navigate('/goals')}>Voltar aos Objetivos</Button>}
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
          className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Objetivos
        </button>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setIsEditModalOpen(true)} className="flex items-center gap-2">
            <Edit2 className="w-4 h-4" />
            Editar
          </Button>
          {goal.status !== 'ARCHIVED' ? (
            <Button variant="danger" onClick={handleArchive} className="flex items-center gap-2">
              <Archive className="w-4 h-4" />
              Arquivar
            </Button>
          ) : (
            <Button variant="secondary" onClick={handleUnarchive} className="flex items-center gap-2 text-emerald-400 border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/10">
              <ArchiveRestore className="w-4 h-4" />
              Desarquivar
            </Button>
          )}
        </div>
      </div>

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
                <p className="text-text-secondary text-sm">{goal.description || 'Sem descrição cadastrada.'}</p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 pt-2">
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  isCompleted
                    ? 'bg-success/10 text-success border-success/20'
                    : goal.status === 'ARCHIVED'
                    ? 'bg-zinc-800 text-zinc-400 border-zinc-700/50'
                    : 'bg-info/10 text-info border-info/20'
                }`}
              >
                {isCompleted ? 'Concluído' : goal.status === 'ARCHIVED' ? 'Arquivado' : 'Em Andamento'}
              </span>

              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
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
              <span className="text-[10px] text-text-muted uppercase tracking-wider block">Progresso Atual</span>
              <MoneyValue amount={goal.currentAmount} showSign={false} className="text-2xl font-bold" />
            </div>
            <div>
              <span className="text-[10px] text-text-muted uppercase tracking-wider block">Meta Total</span>
              <span className="text-base font-semibold text-text-secondary">
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
              <span className="font-semibold">{formatDate(projectedCompletionDate)}</span>. O prazo planejado é{' '}
              <span className="font-semibold">{formatDate(goal.deadline)}</span>. Considere aumentar o valor das
              contribuições mensais.
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
              <span className="font-semibold">R$ {goal.targetAmount.toLocaleString('pt-BR')}</span> foi acumulado com
              sucesso.
            </p>
          </div>
        </div>
      )}

      {/* Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evolution Chart */}
        <Card className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 border-b border-border-subtle pb-4">
            <TrendingUp className="w-5 h-5 text-brand" />
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Evolução do Saldo</h3>
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
                  tickFormatter={(v) => `R$ ${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1D27',
                    border: '1px solid #2A2E45',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#F1F5F9',
                  }}
                  formatter={(value: any) => [formatCurrency(value as number), 'Saldo Acumulado']}
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
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Cronograma & Projeção</h3>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between py-2 border-b border-white/[0.04]">
              <span className="text-text-secondary">Data de Início:</span>
              <span className="text-text-primary font-medium">{formatDate(goal.createdAt.substring(0, 10))}</span>
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
      <Card className="space-y-6">
        <div className="flex justify-between items-center border-b border-border-subtle pb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand" />
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
              Histórico de Contribuições
            </h3>
          </div>
          <Button onClick={() => setIsAddContribModalOpen(true)} className="flex items-center gap-2 py-1.5 px-3 text-xs">
            <Plus className="w-3.5 h-3.5" />
            Registrar Aporte
          </Button>
        </div>

        {contributions.length === 0 ? (
          <EmptyState
            title="Nenhuma contribuição realizada"
            description="Registre uma contribuição manual ou vincule transações para ver o histórico aqui."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-text-muted border-b border-white/[0.04] text-xs uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Data</th>
                  <th className="pb-3 font-semibold">Valor</th>
                  <th className="pb-3 font-semibold">Origem</th>
                  <th className="pb-3 font-semibold">Observação</th>
                  <th className="pb-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {contributions.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="py-4 text-text-primary font-medium">{formatDate(c.contributionDate)}</td>
                    <td className="py-4 font-bold text-success">
                      R$ {c.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          c.type === 'AUTOMATIC'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {c.type === 'AUTOMATIC' ? 'Transação Automática' : 'Manual'}
                      </span>
                    </td>
                    <td className="py-4 text-text-secondary max-w-xs truncate">{c.note || '-'}</td>
                    <td className="py-4 text-right">
                      {c.type === 'MANUAL' && (
                        <button
                          onClick={() => handleDeleteContribution(c.id)}
                          className="p-1 text-text-muted hover:text-danger rounded hover:bg-danger/10 transition-colors"
                          title="Excluir contribuição"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

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
