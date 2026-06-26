import { useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../hooks/useDashboard';
import { cn } from '../../../lib/cn';
import {
  Settings,
  LogOut,
  Wallet,
  DollarSign,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  Percent,
  RefreshCw,
  AlertTriangle,
  LineChart
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie
} from 'recharts';

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(() => {
    return new Date().toISOString().substring(0, 7); // YYYY-MM
  });

  const { summary, isLoading, error, refetch } = useDashboard(currentMonth);

  if (!user) return null;

  const handlePrevMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    setCurrentMonth(date.toISOString().substring(0, 7));
  };

  const handleNextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month, 1);
    setCurrentMonth(date.toISOString().substring(0, 7));
  };

  const handleCurrentMonth = () => {
    setCurrentMonth(new Date().toISOString().substring(0, 7));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: user.currency || 'BRL',
    }).format(value);
  };

  const formatMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    const formatted = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return formatted.replace(/^\w/, (c) => c.toUpperCase());
  };

  // Prepare data for the Cashflow bar chart
  const cashflowData = summary ? [
    { name: 'Entradas', valor: summary.totalRevenue, color: '#10b981' },
    { name: 'Saídas', valor: summary.totalExpenses, color: '#f43f5e' }
  ] : [];

  // Prepare data for the Budget progress donut chart
  const budgetPlanned = summary ? summary.budgetPlanned : 0;
  const budgetRealized = summary ? summary.budgetRealized : 0;
  const budgetRemaining = Math.max(0, budgetPlanned - budgetRealized);
  const isOverBudget = budgetRealized > budgetPlanned;
  const budgetPercent = budgetPlanned > 0 ? Math.min(100, Math.round((budgetRealized / budgetPlanned) * 100)) : 0;

  const budgetData = [
    { name: 'Gasto', valor: budgetRealized, color: isOverBudget ? '#f43f5e' : '#8b5cf6' },
    { name: 'Disponível', valor: budgetRemaining, color: '#27272a' }
  ];

  return (
    <div className="gradient-bg min-h-screen text-white pb-16">
      {/* Navigation bar */}
      <nav className="glassmorphism sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
              <span className="text-lg font-bold text-white tracking-wider">FF</span>
            </div>
            <span className="font-semibold text-lg tracking-tight text-white">FinanceFlow</span>
          </div>

          <div className="flex items-center gap-4">
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
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/50 transition-all flex items-center gap-2 text-sm font-medium"
            >
              <LineChart className="w-4 h-4" />
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

      {/* Main dashboard content */}
      <main className="max-w-6xl mx-auto px-4 mt-10 space-y-8">
        {/* Header and month selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight">Olá, {user.name}!</h1>
            <p className="text-zinc-400 text-sm">Acompanhe a sua saúde financeira atual.</p>
          </div>

          {/* Month selector UI */}
          <div className="flex items-center gap-2 self-start sm:self-auto bg-zinc-900/60 p-1.5 rounded-xl border border-zinc-800/80 glassmorphism">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors"
              title="Mês Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-3 py-1 font-semibold text-sm min-w-[130px] text-center text-zinc-100">
              {formatMonthName(currentMonth)}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors"
              title="Próximo Mês"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={handleCurrentMonth}
              className="px-2.5 py-1 text-xs bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 hover:text-violet-300 font-medium rounded-lg transition-colors ml-1"
            >
              Hoje
            </button>
          </div>
        </div>

        {/* Loading and error state templates */}
        {isLoading && (
          <div className="space-y-8 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="auth-card h-32 bg-zinc-900/20 border border-zinc-800"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="auth-card h-80 bg-zinc-900/20 border border-zinc-800"></div>
              <div className="auth-card h-80 bg-zinc-900/20 border border-zinc-800"></div>
            </div>
          </div>
        )}

        {error && (
          <div className="auth-card p-8 border border-red-500/20 bg-red-500/5 flex flex-col items-center justify-center text-center space-y-4 max-w-lg mx-auto">
            <div className="p-3 bg-red-500/10 text-red-400 rounded-full">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold">Erro ao carregar dados</h3>
              <p className="text-zinc-400 text-sm">Não foi possível carregar as informações do dashboard.</p>
            </div>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl flex items-center gap-2 transition-all border border-zinc-700"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar Novamente
            </button>
          </div>
        )}

        {/* Loaded dashboard data */}
        {!isLoading && !error && summary && (
          <>
            {/* Financial summary metrics grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Revenue Card */}
              <div className="auth-card p-6 border-zinc-800 hover:border-emerald-500/20 transition-all duration-300 relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Receitas do Mês</span>
                    <h2 className="text-2xl font-bold tracking-tight text-emerald-400">{formatCurrency(summary.totalRevenue)}</h2>
                  </div>
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Expense Card */}
              <div className="auth-card p-6 border-zinc-800 hover:border-rose-500/20 transition-all duration-300 relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all"></div>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Despesas do Mês</span>
                    <h2 className="text-2xl font-bold tracking-tight text-rose-400">{formatCurrency(summary.totalExpenses)}</h2>
                  </div>
                  <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl">
                    <ArrowDownRight className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Balance Card */}
              <div className="auth-card p-6 border-zinc-800 hover:border-blue-500/20 transition-all duration-300 relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all"></div>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Saldo do Período</span>
                    <h2 className={cn(
                      "text-2xl font-bold tracking-tight",
                      summary.balance >= 0 ? "text-blue-400" : "text-amber-500"
                    )}>
                      {formatCurrency(summary.balance)}
                    </h2>
                  </div>
                  <div className={cn(
                    "p-2.5 rounded-xl",
                    summary.balance >= 0 ? "bg-blue-500/10 text-blue-400" : "bg-amber-500/10 text-amber-500"
                  )}>
                    <Coins className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Budget Progress Card */}
              <div className="auth-card p-6 border-zinc-800 hover:border-violet-500/20 transition-all duration-300 relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl group-hover:bg-violet-500/10 transition-all"></div>
                <div className="flex justify-between items-start">
                  <div className="space-y-1 w-[70%]">
                    <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Orçamento Utilizado</span>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-100 truncate">
                      {formatCurrency(summary.budgetRealized)}
                    </h2>
                    <p className="text-xs text-zinc-400 truncate">limite de {formatCurrency(summary.budgetPlanned)}</p>
                  </div>
                  <div className={cn(
                    "p-2.5 rounded-xl",
                    isOverBudget ? "bg-rose-500/10 text-rose-400" : "bg-violet-500/10 text-violet-400"
                  )}>
                    <Percent className="w-5 h-5" />
                  </div>
                </div>
                {/* Visual horizontal progress bar inside the card */}
                {summary.budgetPlanned > 0 && (
                  <div className="mt-4 w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isOverBudget ? "bg-rose-500" : "bg-violet-500"
                      )}
                      style={{ width: `${budgetPercent}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>

            {/* Graphs grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Cashflow visual comparison */}
              <div className="auth-card p-8 border-zinc-800 space-y-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold tracking-tight">Fluxo de Caixa Rápido</h3>
                  <p className="text-zinc-400 text-xs mt-1">Comparação de entradas e saídas no mês selecionado.</p>
                </div>

                <div className="h-64 w-full">
                  {summary.totalRevenue === 0 && summary.totalExpenses === 0 ? (
                    <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
                      Nenhuma transação lançada neste mês.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={cashflowData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} />
                        <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$ ${v}`} />
                        <Tooltip
                          cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="glassmorphism rounded-xl border border-zinc-800 p-3 shadow-2xl">
                                  <p className="text-xs text-zinc-400 font-medium">{data.name}</p>
                                  <p className="text-sm font-bold mt-0.5" style={{ color: data.color }}>
                                    {formatCurrency(Number(data.valor))}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
                          {cashflowData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Budget limits and status */}
              <div className="auth-card p-8 border-zinc-800 space-y-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold tracking-tight">Limites de Orçamento</h3>
                  <p className="text-zinc-400 text-xs mt-1">Status de gastos em comparação com o limite planejado.</p>
                </div>

                {summary.budgetPlanned === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-zinc-500 text-sm text-center px-4 space-y-3">
                    <span>Nenhum orçamento planejado para este mês.</span>
                    <button
                      onClick={() => navigate('/budget')}
                      className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs rounded-lg transition-colors border border-violet-500"
                    >
                      Configurar Orçamento
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-around gap-6 h-64">
                    {/* Donut chart */}
                    <div className="relative w-44 h-44 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={budgetData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={4}
                            dataKey="valor"
                          >
                            {budgetData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute flex flex-col items-center justify-center text-center">
                        <span className={cn(
                          "text-3xl font-extrabold tracking-tight",
                          isOverBudget ? "text-rose-500" : "text-violet-400"
                        )}>
                          {budgetPercent}%
                        </span>
                        <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest mt-0.5">Utilizado</span>
                      </div>
                    </div>

                    {/* Chart Legend and detailed details */}
                    <div className="space-y-4 text-sm w-full sm:w-auto">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-violet-600"></div>
                        <div className="flex flex-col">
                          <span className="text-zinc-400 text-xs">Gasto</span>
                          <span className="font-semibold">{formatCurrency(budgetRealized)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-zinc-800"></div>
                        <div className="flex flex-col">
                          <span className="text-zinc-400 text-xs">Disponível</span>
                          <span className="font-semibold text-zinc-300">{formatCurrency(budgetRemaining)}</span>
                        </div>
                      </div>
                      {isOverBudget && (
                        <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20 max-w-[200px]">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>Você ultrapassou o orçamento planejado!</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Feature info footer card */}
            <div className="auth-card p-8 space-y-6">
              <div>
                <h2 className="text-xl font-bold">Painel de Resumo do Dashboard (Fase 1)</h2>
                <p className="text-zinc-400 text-sm mt-1">Métricas calculadas dinamicamente com base nas transações e limites mensais.</p>
              </div>

              <div className="border-t border-zinc-800/80 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-zinc-400">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-violet-500 rounded-full"></span>
                  Integração com gráficos Recharts
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-violet-500 rounded-full"></span>
                  Tempo de resposta de tela inferior a 2 segundos
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-violet-500 rounded-full"></span>
                  Navegação mensal dinâmica com retrocesso e avanço
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-violet-500 rounded-full"></span>
                  Consolidação baseada em datas de competência
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
