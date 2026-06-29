import { useState, useMemo } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useCashFlow } from '../hooks/useCashFlow';
import { useTransactions } from '../../transactions/hooks/useTransactions';
import { cn } from '../../../lib/cn';
import { useView } from '../../../context/ViewContext';
import { useCouple } from '../../couple/hooks/useCouple';
import type { CashFlowDailyPoint } from '../types';
import {
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  Activity,
  ChevronLeft,
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { format, parse, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function CashFlow() {
  const { user } = useAuth();
  const { viewContext } = useView();
  const { coupleStatus } = useCouple();

  const isCouple = viewContext === 'COUPLE';
  const partnerName = coupleStatus.partnerName || 'Parceiro(a)';

  // Period Selector State: yyyy-MM
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return format(today, 'yyyy-MM');
  });

  const currentDate = useMemo(() => {
    return parse(selectedMonth, 'yyyy-MM', new Date());
  }, [selectedMonth]);

  const fromDate = useMemo(() => {
    return format(startOfMonth(currentDate), 'yyyy-MM-dd');
  }, [currentDate]);

  const toDate = useMemo(() => {
    return format(endOfMonth(currentDate), 'yyyy-MM-dd');
  }, [currentDate]);

  // Fetch cash flow projection
  const { projection, isLoading: isCashFlowLoading, error: cashFlowError } = useCashFlow(fromDate, toDate);

  // Fetch transactions for the selected month to show in tooltip
  const { transactions, isLoading: isTxLoading } = useTransactions({
    startDate: fromDate,
    endDate: toDate,
  });

  const isLoading = isCashFlowLoading || isTxLoading;

  const [activeTab, setActiveTab] = useState<'chart' | 'table'>('chart');
  const [tableGroup, setTableGroup] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: user?.currency || 'BRL',
    }).format(value);
  };

  const formatDateDisplay = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const formatXAxisTick = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return parts[2]; // Day number e.g. "01", "15"
    }
    return dateStr;
  };

  const handlePrevMonth = () => {
    setSelectedMonth(format(subMonths(currentDate, 1), 'yyyy-MM'));
  };

  const handleNextMonth = () => {
    setSelectedMonth(format(addMonths(currentDate, 1), 'yyyy-MM'));
  };

  const handleCurrentMonth = () => {
    setSelectedMonth(format(new Date(), 'yyyy-MM'));
  };

  // Format month and year capitalized (e.g. "Junho de 2026")
  const displayMonthYear = useMemo(() => {
    const formatted = format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, [currentDate]);

  // Helper to group daily points by week (aggregates data in selected month)
  const weeklyData = useMemo(() => {
    if (!projection?.dailyPoints) return [];
    
    const weeks: Record<string, { date: string; income: number; expense: number; lastBalance: number; count: number }> = {};
    
    projection.dailyPoints.forEach((point) => {
      const date = new Date(point.date + 'T00:00:00');
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(date.setDate(diff));
      const weekKey = monday.toISOString().substring(0, 10);

      if (!weeks[weekKey]) {
        weeks[weekKey] = {
          date: weekKey,
          income: 0,
          expense: 0,
          lastBalance: point.consolidatedBalance,
          count: 0
        };
      }
      weeks[weekKey].income += point.income;
      weeks[weekKey].expense += point.expense;
      weeks[weekKey].lastBalance = point.consolidatedBalance;
      weeks[weekKey].count += 1;
    });

    return Object.values(weeks).sort((a, b) => a.date.localeCompare(b.date));
  }, [projection]);

  // Helper to group daily points by month
  const monthlyData = useMemo(() => {
    if (!projection?.dailyPoints) return [];

    const months: Record<string, { date: string; income: number; expense: number; lastBalance: number }> = {};

    projection.dailyPoints.forEach((point) => {
      const monthKey = point.date.substring(0, 7); // YYYY-MM

      if (!months[monthKey]) {
        months[monthKey] = {
          date: monthKey,
          income: 0,
          expense: 0,
          lastBalance: point.consolidatedBalance
        };
      }
      months[monthKey].income += point.income;
      months[monthKey].expense += point.expense;
      months[monthKey].lastBalance = point.consolidatedBalance;
    });

    return Object.values(months).sort((a, b) => a.date.localeCompare(b.date));
  }, [projection]);

  // Summary stats calculations (Total Income, Total Expense, Balance, Largest Expense)
  const summaryStats = useMemo(() => {
    if (!projection?.dailyPoints || projection.dailyPoints.length === 0) {
      return { totalIncome: 0, totalExpense: 0, balance: 0 };
    }
    let totalIncome = 0;
    let totalExpense = 0;
    projection.dailyPoints.forEach((p) => {
      totalIncome += p.income;
      totalExpense += p.expense;
    });
    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    };
  }, [projection]);

  const largestExpense = useMemo(() => {
    if (!transactions || transactions.length === 0) return null;
    const expenses = transactions.filter((t) => t.type === 'EXPENSE');
    if (expenses.length === 0) return null;
    return expenses.reduce((max, current) => (current.amount > max.amount ? current : max), expenses[0]);
  }, [transactions]);

  const hasTightness = projection?.tightnessPeriods && projection.tightnessPeriods.length > 0;

  interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
      payload: CashFlowDailyPoint;
    }>;
  }

  // Custom Rich Tooltip for daily charts (grouped BarChart & AreaChart)
  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as CashFlowDailyPoint;
      
      const dayTransactions = transactions.filter((t) => {
        const tDate = t.status === 'PAID' ? t.paymentDate : t.dueDate;
        return tDate === data.date;
      });

      // Breakdown by member (couple mode)
      const breakdown = isCouple ? (() => {
        const userAId = user?.id;
        const userA = dayTransactions.filter(t => t.userId === userAId);
        const userB = dayTransactions.filter(t => t.userId !== userAId);

        const userAIncome = userA.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
        const userAExpense = userA.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
        
        const userBIncome = userB.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
        const userBExpense = userB.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);

        return {
          userA: { income: userAIncome, expense: userAExpense },
          userB: { income: userBIncome, expense: userBExpense }
        };
      })() : null;

      return (
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-4 shadow-2xl space-y-3 min-w-[280px]">
          <div className="border-b border-border-subtle pb-1.5 flex justify-between items-center gap-4">
            <span className="text-xs text-text-secondary font-bold">
              {formatDateDisplay(data.date)}
            </span>
            <span className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
              data.consolidatedBalance < 0
                ? "bg-danger/10 text-danger border-danger/25"
                : "bg-success/10 text-success border-success/25"
            )}>
              Saldo: {formatCurrency(data.consolidatedBalance)}
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-semibold flex items-center justify-between text-success">
              <span>Receitas do Dia:</span>
              <span>+ {formatCurrency(data.income)}</span>
            </div>
            <div className="text-xs font-semibold flex items-center justify-between text-danger">
              <span>Despesas do Dia:</span>
              <span>- {formatCurrency(data.expense)}</span>
            </div>
          </div>

          {/* Breakdown por membro (couple mode) */}
          {isCouple && breakdown && (
            <div className="border-t border-border-subtle pt-2 space-y-1.5">
              <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
                Breakdown por Membro
              </span>
              <div className="space-y-2 text-xs">
                <div className="bg-bg-base/30 p-1.5 rounded-lg border border-border-subtle/50">
                  <p className="text-text-primary font-semibold">{user?.name} (Você)</p>
                  <div className="flex justify-between text-[11px] text-text-secondary mt-0.5">
                    <span className="text-success font-medium">+{formatCurrency(breakdown.userA.income)}</span>
                    <span className="text-danger font-medium">-{formatCurrency(breakdown.userA.expense)}</span>
                  </div>
                </div>
                <div className="bg-bg-base/30 p-1.5 rounded-lg border border-border-subtle/50">
                  <p className="text-text-primary font-semibold">{partnerName}</p>
                  <div className="flex justify-between text-[11px] text-text-secondary mt-0.5">
                    <span className="text-success font-medium">+{formatCurrency(breakdown.userB.income)}</span>
                    <span className="text-danger font-medium">-{formatCurrency(breakdown.userB.expense)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Lista de Transações */}
          <div className="border-t border-border-subtle pt-2 space-y-1.5">
            <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
              Transações do Dia
            </span>
            {dayTransactions.length > 0 ? (
              <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
                {dayTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-start justify-between gap-4 text-xs bg-bg-base/20 hover:bg-bg-base/40 p-1.5 rounded border border-border-subtle/30">
                    <div className="min-w-0 flex-1">
                      <p className="text-text-primary font-medium truncate" title={tx.description}>
                        {tx.description}
                      </p>
                      {isCouple && (
                        <p className="text-[9px] text-text-muted">
                          Dono: {tx.userId === user?.id ? 'Você' : partnerName}
                        </p>
                      )}
                    </div>
                    <span className={cn(
                      "font-semibold shrink-0 text-right",
                      tx.type === 'INCOME' ? 'text-success' : 'text-danger'
                    )}>
                      {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted italic">
                Nenhuma transação prevista ou realizada para hoje.
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (!user) return null;

  return (
    <div className="bg-bg-base min-h-screen text-text-primary pb-16">

      {/* Couple context banner — visible only in COUPLE mode */}
      {isCouple && (
        <div className="bg-brand/10 border-b border-brand/20 py-2 text-center animate-in slide-in-from-top-1 duration-200">
          <span className="text-brand text-xs font-medium">
            🫂 Você está vendo a projeção de fluxo de caixa do casal ({user.name} & {partnerName})
          </span>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 pt-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight text-white">Fluxo de Caixa</h1>
            <p className="text-text-secondary text-sm">
              Projete suas finanças e identifique períodos de aperto antes que aconteçam.
            </p>
          </div>

          {/* Month Navigation & Period Selector */}
          <div className="flex items-center gap-2 bg-bg-surface border border-border-subtle p-1.5 rounded-xl shadow-lg">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-text-secondary hover:text-text-primary rounded-lg hover:bg-bg-elevated transition-colors"
              title="Mês Anterior"
            >
              <ChevronLeft className="w-5.5 h-5.5" />
            </button>
            
            <button
              onClick={handleCurrentMonth}
              className="px-2.5 py-1.5 text-xs font-semibold bg-bg-elevated hover:bg-bg-base border border-border-subtle rounded-lg text-text-secondary hover:text-text-primary transition-colors animate-all"
            >
              Mês Atual
            </button>

            <div className="relative flex items-center gap-2 px-3.5 py-1.5 bg-bg-base border border-border-subtle rounded-lg text-sm font-semibold text-text-primary hover:border-brand/45 transition-colors cursor-pointer group">
              <Calendar className="w-4 h-4 text-brand group-hover:scale-105 transition-transform" />
              <span className="capitalize">{displayMonthYear}</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => {
                  if (e.target.value) setSelectedMonth(e.target.value);
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>

            <button
              onClick={handleNextMonth}
              className="p-1.5 text-text-secondary hover:text-text-primary rounded-lg hover:bg-bg-elevated transition-colors"
              title="Próximo Mês"
            >
              <ChevronRight className="w-5.5 h-5.5" />
            </button>
          </div>
        </div>

        {/* Tightness alerts */}
        {hasTightness && (
          <div className="bg-danger/10 border border-danger/20 rounded-2xl p-6 flex flex-col md:flex-row items-start gap-4 shadow-xl">
            <div className="p-3 bg-danger/20 rounded-xl text-danger">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="text-lg font-bold text-red-200">Alerta de Aperto Financeiro Detectado!</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Suas projeções indicam que o saldo consolidado ficará negativo durante os períodos listados abaixo. Considere adiar pagamentos ou antecipar receitas.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {projection.tightnessPeriods.map((period, idx) => (
                  <div key={idx} className="bg-bg-base/40 border border-danger/10 rounded-xl p-3.5 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-xs text-text-muted">Período de aperto</p>
                      <p className="text-sm font-semibold text-white">
                        {formatDateDisplay(period.startDate)} a {formatDateDisplay(period.endDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-danger">Saldo Mínimo</p>
                      <p className="text-sm font-bold text-danger">{formatCurrency(period.minimumBalance)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Receitas */}
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-text-secondary text-xs font-medium">Receitas do Mês</span>
              <h3 className="text-2xl font-bold tracking-tight text-success">
                + {formatCurrency(summaryStats.totalIncome)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>

          {/* Total Despesas */}
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-text-secondary text-xs font-medium">Despesas do Mês</span>
              <h3 className="text-2xl font-bold tracking-tight text-danger">
                - {formatCurrency(summaryStats.totalExpense)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center text-danger">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>

          {/* Saldo */}
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-text-secondary text-xs font-medium">Saldo do Mês</span>
              <h3 className={cn(
                "text-2xl font-bold tracking-tight",
                summaryStats.balance >= 0 ? "text-success" : "text-danger"
              )}>
                {summaryStats.balance >= 0 ? '+' : ''}{formatCurrency(summaryStats.balance)}
              </h3>
            </div>
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              summaryStats.balance >= 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
            )}>
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
                <p className="text-xs text-text-secondary truncate max-w-full" title={largestExpense.description}>
                  {largestExpense.description}
                </p>
              )}
            </div>
            <div className="w-10 h-10 rounded-xl bg-bg-elevated flex items-center justify-center text-text-secondary shrink-0">
              <TrendingDown className="w-5 h-5 text-danger" />
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex border-b border-border-subtle">
          <button
            onClick={() => setActiveTab('chart')}
            className={cn(
              "px-5 py-3 border-b-2 text-sm font-semibold transition-all",
              activeTab === 'chart'
                ? "border-brand text-brand"
                : "border-transparent text-text-secondary hover:text-text-primary"
            )}
          >
            Gráficos
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={cn(
              "px-5 py-3 border-b-2 text-sm font-semibold transition-all",
              activeTab === 'table'
                ? "border-brand text-brand"
                : "border-transparent text-text-secondary hover:text-text-primary"
            )}
          >
            Tabela Detalhada
          </button>
        </div>

        {/* Dynamic Display Area */}
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand"></div>
              <span className="text-text-secondary text-sm">Carregando dados...</span>
            </div>
          </div>
        ) : cashFlowError ? (
          <div className="h-64 flex items-center justify-center text-danger font-medium">
            Erro ao carregar dados do fluxo de caixa: {cashFlowError.message}
          </div>
        ) : (
          <div>
            {activeTab === 'chart' ? (
              <div className="grid grid-cols-1 gap-8">
                
                {/* 1. Grouped Bar Chart (Daily Distribution) */}
                <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 space-y-6">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-white">Distribuição Diária de Lançamentos</h3>
                    <p className="text-text-secondary text-xs mt-1">Comparação de entradas e saídas previstas por dia.</p>
                  </div>
                  <div className="h-80 w-full">
                    {projection?.dailyPoints.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-text-muted text-sm">
                        Sem dados disponíveis para o período selecionado.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={projection?.dailyPoints} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2A2E45" vertical={false} />
                          <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={formatXAxisTick} />
                          <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$ ${v}`} />
                          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#21253A', opacity: 0.3 }} />
                          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '12px', color: '#94A3B8' }} />
                          <Bar dataKey="income" fill="#22C55E" radius={[4, 4, 0, 0]} name="Receitas" />
                          <Bar dataKey="expense" fill="#EF4444" radius={[4, 4, 0, 0]} name="Despesas" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* 2. Evolution Area Chart (Patrimonial Evolution) */}
                <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 space-y-6">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-white">Evolução Patrimonial</h3>
                    <p className="text-text-secondary text-xs mt-1">Saldo consolidado projetado diariamente no período.</p>
                  </div>

                  <div className="h-80 w-full">
                    {projection?.dailyPoints.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-text-muted text-sm">
                        Sem dados disponíveis para o período selecionado.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={projection?.dailyPoints} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#7C5CFC" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#7C5CFC" stopOpacity={0.0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2A2E45" vertical={false} />
                          <XAxis
                            dataKey="date"
                            stroke="#94A3B8"
                            fontSize={11}
                            tickLine={false}
                            tickFormatter={formatXAxisTick}
                          />
                          <YAxis
                            stroke="#94A3B8"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => `R$ ${v}`}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Area
                            type="monotone"
                            dataKey="consolidatedBalance"
                            stroke="#7C5CFC"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorBalance)"
                            name="Saldo Consolidado"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="space-y-6">
                {/* Granularity controls */}
                <div className="flex bg-bg-surface p-1 rounded-xl border border-border-subtle max-w-xs">
                  <button
                    onClick={() => setTableGroup('daily')}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all",
                      tableGroup === 'daily' ? "bg-bg-elevated text-white" : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    Diário
                  </button>
                  <button
                    onClick={() => setTableGroup('weekly')}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all",
                      tableGroup === 'weekly' ? "bg-bg-elevated text-white" : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    Semanal
                  </button>
                  <button
                    onClick={() => setTableGroup('monthly')}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all",
                      tableGroup === 'monthly' ? "bg-bg-elevated text-white" : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    Mensal
                  </button>
                </div>

                {/* Table */}
                <div className="bg-bg-surface rounded-2xl border border-border-subtle overflow-hidden shadow-lg">
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
                      {tableGroup === 'daily' && projection?.dailyPoints.map((point, idx) => (
                        <tr key={idx} className="hover:bg-bg-elevated/20 transition-colors">
                          <td className="p-4 font-medium text-text-primary">{formatDateDisplay(point.date)}</td>
                          <td className="p-4 text-right text-success font-semibold">
                            {point.income > 0 ? `+ ${formatCurrency(point.income)}` : '-'}
                          </td>
                          <td className="p-4 text-right text-danger font-semibold">
                            {point.expense > 0 ? `- ${formatCurrency(point.expense)}` : '-'}
                          </td>
                          <td className={cn(
                            "p-4 text-right font-bold",
                            point.consolidatedBalance < 0 ? "text-danger" : "text-text-primary"
                          )}>
                            {formatCurrency(point.consolidatedBalance)}
                          </td>
                          <td className="p-4 text-center">
                            <span className={cn(
                              "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium border",
                              point.consolidatedBalance < 0
                                ? "bg-danger/10 text-danger border-danger/20"
                                : "bg-success/10 text-success border-success/20"
                            )}>
                              {point.consolidatedBalance < 0 ? 'Aperto' : 'Positivo'}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {tableGroup === 'weekly' && weeklyData.map((week, idx) => (
                        <tr key={idx} className="hover:bg-bg-elevated/20 transition-colors">
                          <td className="p-4 font-medium flex items-center gap-2 text-text-primary">
                            <CalendarDays className="w-4 h-4 text-brand" />
                            <span>Semana de {formatDateDisplay(week.date)}</span>
                          </td>
                          <td className="p-4 text-right text-success font-semibold">
                            {week.income > 0 ? `+ ${formatCurrency(week.income)}` : '-'}
                          </td>
                          <td className="p-4 text-right text-danger font-semibold">
                            {week.expense > 0 ? `- ${formatCurrency(week.expense)}` : '-'}
                          </td>
                          <td className={cn(
                            "p-4 text-right font-bold",
                            week.lastBalance < 0 ? "text-danger" : "text-text-primary"
                          )}>
                            {formatCurrency(week.lastBalance)}
                          </td>
                          <td className="p-4 text-center">
                            <span className={cn(
                              "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium border",
                              week.lastBalance < 0
                                ? "bg-danger/10 text-danger border-danger/20"
                                : "bg-success/10 text-success border-success/20"
                            )}>
                              {week.lastBalance < 0 ? 'Aperto' : 'Positivo'}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {tableGroup === 'monthly' && monthlyData.map((month, idx) => {
                        const [yr, mn] = month.date.split('-');
                        const dateObj = new Date(Number(yr), Number(mn) - 1, 1);
                        const formattedMonth = dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                        const capitalizedMonth = formattedMonth.replace(/^\w/, (c) => c.toUpperCase());

                        return (
                          <tr key={idx} className="hover:bg-bg-elevated/20 transition-colors">
                            <td className="p-4 font-medium flex items-center gap-2 text-text-primary">
                              <Calendar className="w-4 h-4 text-brand" />
                              <span>{capitalizedMonth}</span>
                            </td>
                            <td className="p-4 text-right text-success font-semibold">
                              {month.income > 0 ? `+ ${formatCurrency(month.income)}` : '-'}
                            </td>
                            <td className="p-4 text-right text-danger font-semibold">
                              {month.expense > 0 ? `- ${formatCurrency(month.expense)}` : '-'}
                            </td>
                            <td className={cn(
                              "p-4 text-right font-bold",
                              month.lastBalance < 0 ? "text-danger" : "text-text-primary"
                            )}>
                              {formatCurrency(month.lastBalance)}
                            </td>
                            <td className="p-4 text-center">
                              <span className={cn(
                                "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium border",
                                month.lastBalance < 0
                                  ? "bg-danger/10 text-danger border-danger/20"
                                  : "bg-success/10 text-success border-success/20"
                              )}>
                                {month.lastBalance < 0 ? 'Aperto' : 'Positivo'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
