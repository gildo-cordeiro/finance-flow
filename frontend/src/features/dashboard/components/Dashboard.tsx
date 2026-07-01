import { useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../hooks/useDashboard';
import { cn } from '../../../lib/cn';
import { useView } from '../../../context/ViewContext';
import { useCouple } from '../../couple/hooks/useCouple';
import { Card } from '../../../components/ui/Card';
import { MoneyValue } from '../../../components/ui/MoneyValue';
import { SectionLabel } from '../../../components/ui/SectionLabel';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useAccounts } from '../../accounts/hooks/useAccounts';
import { useTransactions } from '../../transactions/hooks/useTransactions';
import { useCategories } from '../../transactions/hooks/useCategories';
import { useQueryClient } from '@tanstack/react-query';
import { formatDate } from '../../../utils/formatters';
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Heart,
  ShoppingBag,
  DollarSign,
  Home,
  Car,
  Smile,
  FileText,
  Coffee,
  PiggyBank,
  Briefcase,
  Wrench,
  Tag
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

const DashboardSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    {/* Grid of 4 cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="p-5 flex flex-col justify-between h-32">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-32" />
          </div>
          <Skeleton className="h-3 w-24" />
        </Card>
      ))}
    </div>
    {/* Charts & list grid */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Chart skeleton */}
      <Card className="lg:col-span-2 p-6 h-96 flex flex-col justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3.5 w-32" />
        </div>
        <div className="flex items-end justify-between gap-4 h-64 px-4 pb-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex gap-2 items-end w-full h-full justify-center">
              <Skeleton className="w-6 sm:w-8 bg-zinc-800/40" style={{ height: `${20 + Math.random() * 60}%` }} />
              <Skeleton className="w-6 sm:w-8 bg-zinc-800/40" style={{ height: `${10 + Math.random() * 50}%` }} />
            </div>
          ))}
        </div>
      </Card>
      {/* Recent transactions list skeleton */}
      <Card className="p-6 h-96 flex flex-col justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3.5 w-24" />
        </div>
        <div className="space-y-3.5 my-4 overflow-hidden flex-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between border-b border-border-subtle/50 pb-2.5">
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
        <Skeleton className="h-4 w-16 self-center" />
      </Card>
    </div>
  </div>
);

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { viewContext } = useView();
  const { coupleStatus } = useCouple();
  const queryClient = useQueryClient();
  
  const [currentMonth, setCurrentMonth] = useState(() => {
    return new Date().toISOString().substring(0, 7); // YYYY-MM
  });

  const isCouple = viewContext === 'COUPLE';
  const partnerName = coupleStatus.partnerName || 'Parceiro(a)';

  // 1. Fetch dashboard summary
  const { summary, isLoading: isSummaryLoading, error: summaryError } = useDashboard(currentMonth);

  // 2. Fetch accounts to calculate Saldo Atual
  const { accounts, isLoading: isAccountsLoading, error: accountsError } = useAccounts();

  // 3. Fetch categories to get category names and icons
  const { categories, isLoading: isCategoriesLoading, error: categoriesError } = useCategories();

  // 4. Calculate local date ranges for next 7 days (A Pagar)
  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = new Date();
  const todayStr = formatLocalDate(today);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = formatLocalDate(nextWeek);

  const { 
    transactions: upcomingTransactions, 
    isLoading: isUpcomingLoading, 
    error: upcomingError 
  } = useTransactions("ALL", {
    startDate: todayStr,
    endDate: nextWeekStr,
  });

  // 5. Fetch transactions for the last 6 months (History & Recent Transactions)
  const getLast6MonthsRange = (currentMonthStr: string) => {
    const [year, month] = currentMonthStr.split('-').map(Number);
    const startDateObj = new Date(year, month - 6, 1);
    const startYear = startDateObj.getFullYear();
    const startMonth = String(startDateObj.getMonth() + 1).padStart(2, '0');
    const startDate = `${startYear}-${startMonth}-01`;

    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${currentMonthStr}-${String(lastDay).padStart(2, '0')}`;

    return { startDate, endDate };
  };

  const { startDate: start6MonthsDate, endDate: end6MonthsDate } = getLast6MonthsRange(currentMonth);

  const { 
    transactions: historyTransactions, 
    isLoading: isHistoryLoading, 
    error: historyError 
  } = useTransactions("ALL", {
    startDate: start6MonthsDate,
    endDate: end6MonthsDate,
  });

  // 6. Aggregate data loaders
  const isDashboardLoading =
    isSummaryLoading ||
    isAccountsLoading ||
    isCategoriesLoading ||
    isUpcomingLoading ||
    isHistoryLoading;

  const dashboardError =
    summaryError ||
    accountsError ||
    categoriesError ||
    upcomingError ||
    historyError;

  if (!user) return null;

  // Month navigation handlers
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

  const formatMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    const formatted = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return formatted.replace(/^\w/, (c) => c.toUpperCase());
  };

  // 7. Calculations
  // Total Balance (soma das contas)
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  // A pagar: total of unpaid expenses within the next 7 days
  const unpaidNext7Days = upcomingTransactions.filter(
    (t) => t.type === 'EXPENSE' && t.status !== 'PAID' && t.dueDate >= todayStr && t.dueDate <= nextWeekStr
  );
  const totalUnpaidNext7Days = unpaidNext7Days.reduce((sum, t) => sum + t.amount, 0);

  // Recent transactions of the selected month
  const monthTransactions = historyTransactions.filter((t) =>
    t.competenceDate.startsWith(currentMonth)
  );
  const recentTransactions = [...monthTransactions]
    .sort((a, b) => b.competenceDate.localeCompare(a.competenceDate))
    .slice(0, 5);

  // Aggregate cashflow for the last 6 months
  const aggregateTransactionsByMonth = (
    txs: typeof historyTransactions,
    currentMonthStr: string,
    userId: string,
    isCoupleContext: boolean
  ) => {
    const [year, month] = currentMonthStr.split('-').map(Number);
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1);
      const yStr = d.getFullYear();
      const mStr = String(d.getMonth() + 1).padStart(2, '0');
      const monthKey = `${yStr}-${mStr}`;

      const monthName = d.toLocaleDateString('pt-BR', { month: 'short' })
        .replace('.', '')
        .replace(/^\w/, (c) => c.toUpperCase());

      const monthTxs = txs.filter((t) => t.competenceDate.startsWith(monthKey));

      const totalRevenue = monthTxs
        .filter((t) => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpenses = monthTxs
        .filter((t) => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0);

      let userRevenue = 0;
      let userExpenses = 0;
      let partnerRevenue = 0;
      let partnerExpenses = 0;

      if (isCoupleContext) {
        userRevenue = monthTxs
          .filter((t) => t.type === 'INCOME' && t.userId === userId)
          .reduce((sum, t) => sum + t.amount, 0);

        userExpenses = monthTxs
          .filter((t) => t.type === 'EXPENSE' && t.userId === userId)
          .reduce((sum, t) => sum + t.amount, 0);

        partnerRevenue = totalRevenue - userRevenue;
        partnerExpenses = totalExpenses - userExpenses;
      }

      data.push({
        name: monthName,
        receitas: totalRevenue,
        despesas: totalExpenses,
        userRevenue,
        userExpenses,
        partnerRevenue,
        partnerExpenses,
      });
    }

    return data;
  };

  const chartData = aggregateTransactionsByMonth(
    historyTransactions,
    currentMonth,
    user.id,
    isCouple
  );

  const breakdown = summary?.memberBreakdown;

  // Category to Icon mapping helper
  const getCategoryIcon = (categoryName?: string) => {
    const name = categoryName?.toLowerCase() || '';
    if (name.includes('alimentação') || name.includes('comida') || name.includes('mercado') || name.includes('restaurante') || name.includes('supermercado')) {
      return Coffee;
    }
    if (name.includes('transporte') || name.includes('carro') || name.includes('combustível') || name.includes('uber') || name.includes('moto')) {
      return Car;
    }
    if (name.includes('moradia') || name.includes('casa') || name.includes('aluguel') || name.includes('energia') || name.includes('água') || name.includes('internet')) {
      return Home;
    }
    if (name.includes('saúde') || name.includes('farmácia') || name.includes('médico') || name.includes('dentista') || name.includes('hospital')) {
      return Heart;
    }
    if (name.includes('educação') || name.includes('curso') || name.includes('faculdade') || name.includes('escola') || name.includes('livro')) {
      return FileText;
    }
    if (name.includes('lazer') || name.includes('viagem') || name.includes('cinema') || name.includes('show') || name.includes('diversão')) {
      return Smile;
    }
    if (name.includes('compras') || name.includes('roupa') || name.includes('eletrônico') || name.includes('presente') || name.includes('shopping')) {
      return ShoppingBag;
    }
    if (name.includes('salário') || name.includes('renda') || name.includes('investimento') || name.includes('ganho') || name.includes('receita')) {
      return DollarSign;
    }
    if (name.includes('investimentos') || name.includes('poupança') || name.includes('reserva')) {
      return PiggyBank;
    }
    if (name.includes('trabalho') || name.includes('freelance') || name.includes('serviço')) {
      return Briefcase;
    }
    if (name.includes('serviços') || name.includes('manutenção') || name.includes('reforma')) {
      return Wrench;
    }
    return Tag;
  };

  // Grouped BarChart Custom Tooltip
  interface ChartPoint {
    name: string;
    receitas: number;
    despesas: number;
    userRevenue: number;
    userExpenses: number;
    partnerRevenue: number;
    partnerExpenses: number;
  }

  interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
      payload: ChartPoint;
    }>;
    label?: string;
  }

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-4 shadow-2xl space-y-3">
          <p className="text-sm font-bold text-white border-b border-border-subtle pb-1.5">{label}</p>
          <div className="space-y-2">
            {/* Receitas */}
            <div className="space-y-1">
              <div className="flex justify-between items-center gap-6">
                <span className="text-success text-xs font-semibold">Receitas:</span>
                <MoneyValue amount={data.receitas} showSign={false} className="text-success text-xs font-bold" />
              </div>
              {isCouple && (
                <div className="text-[10px] text-text-secondary pl-2 flex flex-col gap-0.5 border-l border-success/20">
                  <span>Meu: <MoneyValue amount={data.userRevenue} showSign={false} className="font-normal text-text-secondary" /></span>
                  <span>{partnerName}: <MoneyValue amount={data.partnerRevenue} showSign={false} className="font-normal text-text-secondary" /></span>
                </div>
              )}
            </div>
            {/* Despesas */}
            <div className="space-y-1 border-t border-border-subtle/50 pt-2">
              <div className="flex justify-between items-center gap-6">
                <span className="text-danger text-xs font-semibold">Despesas:</span>
                <MoneyValue amount={data.despesas} showSign={false} className="text-danger text-xs font-bold" />
              </div>
              {isCouple && (
                <div className="text-[10px] text-text-secondary pl-2 flex flex-col gap-0.5 border-l border-danger/20">
                  <span>Meu: <MoneyValue amount={data.userExpenses} showSign={false} className="font-normal text-text-secondary" /></span>
                  <span>{partnerName}: <MoneyValue amount={data.partnerExpenses} showSign={false} className="font-normal text-text-secondary" /></span>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const handleRetry = () => {
    queryClient.invalidateQueries();
  };

  return (
    <div className="bg-bg-base min-h-screen text-white pb-16">
      {/* Couple context banner — visible only in COUPLE mode */}
      {isCouple && (
        <div 
          className="w-full py-2.5 px-4 flex items-center justify-center gap-2 border-b"
          style={{
            backgroundColor: 'rgba(124, 92, 252, 0.1)',
            borderBottom: '1px solid rgba(124, 92, 252, 0.3)',
          }}
        >
          <Heart className="w-4 h-4 text-violet-400 fill-violet-400/20 shrink-0" />
          <span className="text-zinc-200 text-xs sm:text-sm font-medium">
            Visualizando finanças do casal — Você + {partnerName}
          </span>
        </div>
      )}

      {/* Main dashboard content */}
      <main className="max-w-6xl mx-auto px-4 pt-10 space-y-8">
        {/* Header and month selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight">
              {isCouple
                ? `Finanças de ${user.name} & ${partnerName}`
                : `Olá, ${user.name}!`
              }
            </h1>
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
        {isDashboardLoading ? (
          <DashboardSkeleton />
        ) : dashboardError ? (
          <div className="auth-card p-8 border border-red-500/20 bg-red-500/5 flex flex-col items-center justify-center text-center space-y-4 max-w-lg mx-auto">
            <div className="p-3 bg-red-500/10 text-red-400 rounded-full">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold">Erro ao carregar dados</h3>
              <p className="text-zinc-400 text-sm">Não foi possível carregar as informações do dashboard.</p>
            </div>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl flex items-center gap-2 transition-all border border-zinc-700"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar Novamente
            </button>
          </div>
        ) : summary ? (
          <>
            {/* Financial summary metrics grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Revenue Card */}
              <Card className="hover:border-success/20 transition-all duration-300 relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-success/5 rounded-full blur-2xl group-hover:bg-success/10 transition-all"></div>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <SectionLabel className="block mb-1">Receitas do Mês</SectionLabel>
                    <div className="text-2xl font-bold text-white">
                      <MoneyValue amount={summary.totalRevenue} showSign={false} className="text-white font-bold" />
                    </div>
                    {isCouple && breakdown && (
                      <p className="text-xs text-text-secondary mt-1">
                        Meu: <MoneyValue amount={breakdown.userRevenue} showSign={false} className="font-medium text-text-secondary animate-none" /> | Casal: <MoneyValue amount={breakdown.partnerRevenue} showSign={false} className="font-medium text-text-secondary animate-none" />
                      </p>
                    )}
                  </div>
                  <div className="p-2.5 bg-success/10 text-success rounded-xl">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                </div>
              </Card>

              {/* Expense Card */}
              <Card className="hover:border-danger/20 transition-all duration-300 relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-danger/5 rounded-full blur-2xl group-hover:bg-danger/10 transition-all"></div>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <SectionLabel className="block mb-1">Despesas do Mês</SectionLabel>
                    <div className="text-2xl font-bold text-white">
                      <MoneyValue amount={summary.totalExpenses} showSign={false} className="text-white font-bold" />
                    </div>
                    {isCouple && breakdown && (
                      <p className="text-xs text-text-secondary mt-1">
                        Meu: <MoneyValue amount={breakdown.userExpenses} showSign={false} className="font-medium text-text-secondary animate-none" /> | Casal: <MoneyValue amount={breakdown.partnerExpenses} showSign={false} className="font-medium text-text-secondary animate-none" />
                      </p>
                    )}
                  </div>
                  <div className="p-2.5 bg-danger/10 text-danger rounded-xl">
                    <ArrowDownRight className="w-5 h-5" />
                  </div>
                </div>
              </Card>

              {/* Balance Card */}
              <Card className="hover:border-info/20 transition-all duration-300 relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-info/5 rounded-full blur-2xl group-hover:bg-info/10 transition-all"></div>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <SectionLabel className="block mb-1">Saldo Atual</SectionLabel>
                    <div className="text-2xl font-bold text-white">
                      <MoneyValue amount={totalBalance} showSign={false} className="text-white font-bold animate-none" />
                    </div>
                    <p className="text-xs text-text-secondary mt-1">
                      Soma das contas
                    </p>
                  </div>
                  <div className={cn(
                    "p-2.5 rounded-xl",
                    totalBalance >= 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                  )}>
                    <Coins className="w-5 h-5" />
                  </div>
                </div>
              </Card>

              {/* A Pagar Card */}
              <Card className="hover:border-warning/20 transition-all duration-300 relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-warning/5 rounded-full blur-2xl group-hover:bg-warning/10 transition-all"></div>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <SectionLabel className="block mb-1">A Pagar</SectionLabel>
                    <div className="text-2xl font-bold text-white">
                      <MoneyValue amount={totalUnpaidNext7Days} showSign={false} className="text-white font-bold animate-none" />
                    </div>
                    <p className="text-xs text-text-secondary mt-1">
                      Vencimentos próximos 7 dias
                    </p>
                  </div>
                  <div className="p-2.5 bg-warning/10 text-warning rounded-xl">
                    <Calendar className="w-5 h-5" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Graphs and Recent Transactions grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cashflow visual comparison (Grouped Bar Chart) */}
              <Card className="lg:col-span-2 p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold tracking-tight">Fluxo de Caixa</h3>
                  <p className="text-zinc-400 text-xs mt-1">Histórico de receitas e despesas dos últimos 6 meses.</p>
                </div>

                <div className="h-72 w-full mt-6">
                  {chartData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
                      Nenhum dado de fluxo de caixa disponível.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 20, right: 10, left: -10, bottom: 5 }}>
                        <XAxis 
                          dataKey="name" 
                          stroke="#71717a" 
                          fontSize={11} 
                          tickLine={false} 
                          axisLine={false} 
                          tick={{ fill: '#71717a' }}
                        />
                        <YAxis 
                          stroke="#71717a" 
                          fontSize={11} 
                          tickLine={false} 
                          axisLine={false} 
                          tick={{ fill: '#71717a' }}
                          tickFormatter={(v) => `R$ ${v}`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                          iconType="circle"
                          iconSize={8}
                          wrapperStyle={{ fontSize: '11px', paddingTop: '12px', color: '#a1a1aa' }}
                        />
                        <Bar dataKey="receitas" name="Receitas" fill="#22C55E" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="despesas" name="Despesas" fill="#EF4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>

              {/* Recent Transactions List */}
              <Card className="p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold tracking-tight">Transações Recentes</h3>
                  <p className="text-zinc-400 text-xs mt-1">Últimos lançamentos deste mês.</p>
                </div>

                <div className="flex-1 my-6 overflow-hidden">
                  {recentTransactions.length === 0 ? (
                    <EmptyState
                      title="Nenhuma transação"
                      description="Nenhuma transação lançada neste mês."
                      action={
                        <button
                          onClick={() => navigate('/transactions')}
                          className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs rounded-lg transition-colors"
                        >
                          Adicionar Transação
                        </button>
                      }
                    />
                  ) : (
                    <div className="space-y-4">
                      {recentTransactions.map((t) => {
                        const cat = categories.find((c) => c.id === t.categoryId);
                        const categoryName = cat ? cat.name : 'Outros';
                        const Icon = getCategoryIcon(categoryName);
                        const isIncome = t.type === 'INCOME';

                        return (
                          <div key={t.id} className="flex items-center justify-between border-b border-border-subtle/50 pb-3 last:border-0 last:pb-0">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={cn(
                                "p-2 rounded-xl shrink-0",
                                isIncome ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                              )}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-white truncate" title={t.description}>
                                  {t.description}
                                </p>
                                <p className="text-xs text-text-secondary">
                                  {formatDate(t.competenceDate)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0 ml-2">
                              <MoneyValue 
                                amount={isIncome ? t.amount : -t.amount} 
                                showSign={true} 
                                className={cn(
                                  "text-sm font-bold",
                                  isIncome ? "text-success" : "text-danger animate-none"
                                )} 
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => navigate('/transactions')}
                  className="w-full text-center text-xs font-semibold text-brand hover:text-violet-400 transition-colors pt-2 border-t border-border-subtle/50"
                >
                  Ver todas
                </button>
              </Card>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}

