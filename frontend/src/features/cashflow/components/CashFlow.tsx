import { useState, useMemo } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useCashFlow } from '../hooks/useCashFlow';
import { cn } from '../../../lib/cn';
import type { CashFlowDailyPoint } from '../types';
import {
  Wallet,
  DollarSign,
  TrendingUp,
  Settings,
  LogOut,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  Activity,
  LineChart as LineChartIcon
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
  CartesianGrid
} from 'recharts';

export function CashFlow() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Range default: today to today + 30 days
  const [fromDate, setFromDate] = useState(() => {
    const today = new Date();
    return today.toISOString().substring(0, 10);
  });
  const [toDate, setToDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 30);
    return today.toISOString().substring(0, 10);
  });

  const { projection, isLoading, error } = useCashFlow(fromDate, toDate);

  const [activeTab, setActiveTab] = useState<'chart' | 'table'>('chart');
  const [tableGroup, setTableGroup] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: user?.currency || 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const setPreset = (days: number) => {
    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + days);
    setFromDate(today.toISOString().substring(0, 10));
    setToDate(future.toISOString().substring(0, 10));
  };

  // Helper to group daily points by week
  const weeklyData = useMemo(() => {
    if (!projection?.dailyPoints) return [];
    
    const weeks: Record<string, { date: string; income: number; expense: number; lastBalance: number; count: number }> = {};
    
    projection.dailyPoints.forEach((point) => {
      // Find the Monday of the week
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
      weeks[weekKey].lastBalance = point.consolidatedBalance; // latest in date order
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

  // Summaries based on current projection
  const summaryStats = useMemo(() => {
    if (!projection?.dailyPoints || projection.dailyPoints.length === 0) {
      return { initialBalance: 0, finalBalance: 0, totalIncome: 0, totalExpense: 0 };
    }
    const pts = projection.dailyPoints;
    const initialBalance = pts[0].consolidatedBalance;
    const finalBalance = pts[pts.length - 1].consolidatedBalance;
    let totalIncome = 0;
    let totalExpense = 0;
    pts.forEach(p => {
      totalIncome += p.income;
      totalExpense += p.expense;
    });

    return { initialBalance, finalBalance, totalIncome, totalExpense };
  }, [projection]);

  const hasTightness = projection?.tightnessPeriods && projection.tightnessPeriods.length > 0;

  if (!user) return null;

  return (
    <div className="gradient-bg min-h-screen text-white pb-16">
      {/* Navigation bar */}
      <nav className="glassmorphism sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <span className="text-lg font-bold text-white tracking-wider">FF</span>
            </div>
            <span className="font-semibold text-lg tracking-tight text-white cursor-pointer" onClick={() => navigate('/')}>FinanceFlow</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/50 transition-all flex items-center gap-2 text-sm font-medium"
            >
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <button
              onClick={() => navigate('/accounts')}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/50 transition-all flex items-center gap-2 text-sm font-medium"
            >
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">Minhas Contas</span>
            </button>
            <button
              onClick={() => navigate('/transactions')}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/50 transition-all flex items-center gap-2 text-sm font-medium"
            >
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Transações</span>
            </button>
            <button
              onClick={() => navigate('/budget')}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/50 transition-all flex items-center gap-2 text-sm font-medium"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Orçamento</span>
            </button>
            <button
              onClick={() => navigate('/cashflow')}
              className="p-2 text-white bg-violet-600/20 border border-violet-500/30 rounded-lg hover:bg-violet-600/30 transition-all flex items-center gap-2 text-sm font-medium"
            >
              <LineChartIcon className="w-4 h-4 text-violet-400" />
              <span className="hidden sm:inline">Fluxo de Caixa</span>
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/50 transition-all flex items-center gap-2 text-sm font-medium"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Configurações</span>
            </button>
            <button
              onClick={logout}
              className="p-2 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-red-500/5 transition-all flex items-center gap-2 text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 mt-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight">Fluxo de Caixa</h1>
            <p className="text-zinc-400 text-sm">
              Projete suas finanças e identifique períodos de aperto antes que aconteçam.
            </p>
          </div>

          {/* Quick presets & Custom dates */}
          <div className="flex flex-wrap items-center gap-3 bg-zinc-900/60 p-2.5 rounded-2xl border border-zinc-800/80 backdrop-blur-sm">
            <button
              onClick={() => setPreset(15)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all"
            >
              15 dias
            </button>
            <button
              onClick={() => setPreset(30)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all"
            >
              30 dias
            </button>
            <button
              onClick={() => setPreset(90)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all"
            >
              90 dias
            </button>
            <div className="h-4 w-px bg-zinc-800 mx-1"></div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs font-medium text-white focus:outline-none focus:border-violet-500 transition-colors"
              />
              <span className="text-zinc-500 text-xs">até</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs font-medium text-white focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Tightness alerts */}
        {hasTightness && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-start gap-4 shadow-xl">
            <div className="p-3 bg-rose-500/20 rounded-xl text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="text-lg font-bold text-rose-200">Alerta de Aperto Financeiro Detectado!</h3>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Suas projeções indicam que o saldo consolidado ficará negativo durante os períodos listados abaixo. Considere adiar pagamentos ou antecipar receitas.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {projection.tightnessPeriods.map((period, idx) => (
                  <div key={idx} className="bg-zinc-950/40 border border-rose-500/10 rounded-xl p-3.5 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-xs text-zinc-400">Período de aperto</p>
                      <p className="text-sm font-semibold text-white">
                        {formatDate(period.startDate)} a {formatDate(period.endDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-rose-400">Saldo Mínimo</p>
                      <p className="text-sm font-bold text-rose-400">{formatCurrency(period.minimumBalance)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="auth-card p-6 border-zinc-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-zinc-400 text-xs font-medium">Saldo Inicial</span>
              <h3 className="text-2xl font-bold tracking-tight">
                {formatCurrency(summaryStats.initialBalance)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-300">
              <Wallet className="w-5 h-5" />
            </div>
          </div>

          <div className="auth-card p-6 border-zinc-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-zinc-400 text-xs font-medium">Saldo Final Projetado</span>
              <h3 className={cn(
                "text-2xl font-bold tracking-tight",
                summaryStats.finalBalance < 0 ? "text-rose-400" : "text-emerald-400"
              )}>
                {formatCurrency(summaryStats.finalBalance)}
              </h3>
            </div>
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              summaryStats.finalBalance < 0 ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"
            )}>
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="auth-card p-6 border-zinc-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-zinc-400 text-xs font-medium">Total de Entradas</span>
              <h3 className="text-2xl font-bold tracking-tight text-emerald-400">
                + {formatCurrency(summaryStats.totalIncome)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>

          <div className="auth-card p-6 border-zinc-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-zinc-400 text-xs font-medium">Total de Saídas</span>
              <h3 className="text-2xl font-bold tracking-tight text-rose-400">
                - {formatCurrency(summaryStats.totalExpense)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex border-b border-zinc-800">
          <button
            onClick={() => setActiveTab('chart')}
            className={cn(
              "px-5 py-3 border-b-2 text-sm font-semibold transition-all",
              activeTab === 'chart'
                ? "border-violet-500 text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            Gráfico de Evolução
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={cn(
              "px-5 py-3 border-b-2 text-sm font-semibold transition-all",
              activeTab === 'table'
                ? "border-violet-500 text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            Tabela Detalhada
          </button>
        </div>

        {/* Dynamic Display Area */}
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500"></div>
              <span className="text-zinc-400 text-sm">Carregando projeções...</span>
            </div>
          </div>
        ) : error ? (
          <div className="h-64 flex items-center justify-center text-rose-400 font-medium">
            Erro ao carregar dados do fluxo de caixa: {error.message}
          </div>
        ) : (
          <div>
            {activeTab === 'chart' ? (
              <div className="grid grid-cols-1 gap-8">
                {/* Evolution Area Chart */}
                <div className="auth-card p-6 border-zinc-800 space-y-6">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight">Evolução Patrimonial</h3>
                    <p className="text-zinc-400 text-xs mt-1">Saldo consolidado projetado diariamente no período.</p>
                  </div>

                  <div className="h-80 w-full">
                    {projection?.dailyPoints.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
                        Sem dados disponíveis para o período selecionado.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={projection?.dailyPoints} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis
                            dataKey="date"
                            stroke="#71717a"
                            fontSize={11}
                            tickLine={false}
                            tickFormatter={formatDate}
                          />
                          <YAxis
                            stroke="#71717a"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => `R$ ${v}`}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload as CashFlowDailyPoint;
                                return (
                                  <div className="glassmorphism rounded-xl border border-zinc-800 p-4 shadow-2xl space-y-2">
                                    <p className="text-xs text-zinc-400 font-bold border-b border-zinc-800 pb-1.5">{formatDate(data.date)}</p>
                                    <div className="space-y-1">
                                      <p className="text-sm font-semibold flex items-center justify-between gap-6">
                                        <span className="text-zinc-400 font-normal">Saldo Projetado:</span>
                                        <span className={data.consolidatedBalance < 0 ? 'text-rose-400' : 'text-violet-400'}>
                                          {formatCurrency(data.consolidatedBalance)}
                                        </span>
                                      </p>
                                      {data.income > 0 && (
                                        <p className="text-xs font-semibold flex items-center justify-between text-emerald-400">
                                          <span>Entradas:</span>
                                          <span>+ {formatCurrency(data.income)}</span>
                                        </p>
                                      )}
                                      {data.expense > 0 && (
                                        <p className="text-xs font-semibold flex items-center justify-between text-rose-400">
                                          <span>Saídas:</span>
                                          <span>- {formatCurrency(data.expense)}</span>
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="consolidatedBalance"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorBalance)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Event distribution */}
                <div className="auth-card p-6 border-zinc-800 space-y-6">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight">Distribuição Diária de Lançamentos</h3>
                    <p className="text-zinc-400 text-xs mt-1">Comparação de entradas e saídas previstas por dia.</p>
                  </div>
                  <div className="h-64 w-full">
                    {projection?.dailyPoints.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
                        Sem dados disponíveis.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={projection?.dailyPoints} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} tickFormatter={formatDate} />
                          <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$ ${v}`} />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload as CashFlowDailyPoint;
                                return (
                                  <div className="glassmorphism rounded-xl border border-zinc-800 p-3 shadow-2xl space-y-1">
                                    <p className="text-xs text-zinc-400 font-bold border-b border-zinc-850 pb-1">{formatDate(data.date)}</p>
                                    <p className="text-xs text-emerald-400">Entradas: {formatCurrency(data.income)}</p>
                                    <p className="text-xs text-rose-400">Saídas: {formatCurrency(data.expense)}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Entradas" />
                          <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Saídas" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Granularity controls */}
                <div className="flex bg-zinc-900/40 p-1 rounded-xl border border-zinc-800/80 max-w-xs">
                  <button
                    onClick={() => setTableGroup('daily')}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all",
                      tableGroup === 'daily' ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
                    )}
                  >
                    Diário
                  </button>
                  <button
                    onClick={() => setTableGroup('weekly')}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all",
                      tableGroup === 'weekly' ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
                    )}
                  >
                    Semanal
                  </button>
                  <button
                    onClick={() => setTableGroup('monthly')}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all",
                      tableGroup === 'monthly' ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
                    )}
                  >
                    Mensal
                  </button>
                </div>

                {/* Table */}
                <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800/80 overflow-hidden shadow-lg">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-950/60 border-b border-zinc-800/80 text-zinc-400 text-xs font-semibold">
                        <th className="p-4">Período / Data</th>
                        <th className="p-4 text-right">Entradas</th>
                        <th className="p-4 text-right">Saídas</th>
                        <th className="p-4 text-right">Saldo Final do Período</th>
                        <th className="p-4 text-center">Status de Caixa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/40 text-sm">
                      {tableGroup === 'daily' && projection?.dailyPoints.map((point, idx) => (
                        <tr key={idx} className="hover:bg-zinc-800/20 transition-colors">
                          <td className="p-4 font-medium">{formatDate(point.date)}</td>
                          <td className="p-4 text-right text-emerald-400 font-semibold">
                            {point.income > 0 ? `+ ${formatCurrency(point.income)}` : '-'}
                          </td>
                          <td className="p-4 text-right text-rose-400 font-semibold">
                            {point.expense > 0 ? `- ${formatCurrency(point.expense)}` : '-'}
                          </td>
                          <td className={cn(
                            "p-4 text-right font-bold",
                            point.consolidatedBalance < 0 ? "text-rose-400" : "text-zinc-100"
                          )}>
                            {formatCurrency(point.consolidatedBalance)}
                          </td>
                          <td className="p-4 text-center">
                            <span className={cn(
                              "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium border",
                              point.consolidatedBalance < 0
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            )}>
                              {point.consolidatedBalance < 0 ? 'Aperto' : 'Positivo'}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {tableGroup === 'weekly' && weeklyData.map((week, idx) => (
                        <tr key={idx} className="hover:bg-zinc-800/20 transition-colors">
                          <td className="p-4 font-medium flex items-center gap-2">
                            <CalendarDays className="w-4 h-4 text-violet-400" />
                            <span>Semana de {formatDate(week.date)}</span>
                          </td>
                          <td className="p-4 text-right text-emerald-400 font-semibold">
                            {week.income > 0 ? `+ ${formatCurrency(week.income)}` : '-'}
                          </td>
                          <td className="p-4 text-right text-rose-400 font-semibold">
                            {week.expense > 0 ? `- ${formatCurrency(week.expense)}` : '-'}
                          </td>
                          <td className={cn(
                            "p-4 text-right font-bold",
                            week.lastBalance < 0 ? "text-rose-400" : "text-zinc-100"
                          )}>
                            {formatCurrency(week.lastBalance)}
                          </td>
                          <td className="p-4 text-center">
                            <span className={cn(
                              "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium border",
                              week.lastBalance < 0
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
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
                          <tr key={idx} className="hover:bg-zinc-800/20 transition-colors">
                            <td className="p-4 font-medium flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-violet-400" />
                              <span>{capitalizedMonth}</span>
                            </td>
                            <td className="p-4 text-right text-emerald-400 font-semibold">
                              {month.income > 0 ? `+ ${formatCurrency(month.income)}` : '-'}
                            </td>
                            <td className="p-4 text-right text-rose-400 font-semibold">
                              {month.expense > 0 ? `- ${formatCurrency(month.expense)}` : '-'}
                            </td>
                            <td className={cn(
                              "p-4 text-right font-bold",
                              month.lastBalance < 0 ? "text-rose-400" : "text-zinc-100"
                            )}>
                              {formatCurrency(month.lastBalance)}
                            </td>
                            <td className="p-4 text-center">
                              <span className={cn(
                                "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium border",
                                month.lastBalance < 0
                                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
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
