import { useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useDashboard } from '../hooks/useDashboard';
import { useView } from '../../../context/ViewContext';
import { useCouple } from '../../couple/hooks/useCouple';
import { Card } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useAccounts } from '../../accounts/hooks/useAccounts';
import { useTransactions } from '../../transactions/hooks/useTransactions';
import { useCategories } from '../../transactions/hooks/useCategories';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, RefreshCw, Heart } from 'lucide-react';
import { KpiCards } from './KpiCards';
import { CashFlowChart } from './CashFlowChart';
import { RecentTransactions } from './RecentTransactions';
import { CategoryExpensesChart } from './CategoryExpensesChart';
import { BudgetProgressList } from './BudgetProgressList';
import { PeriodSelector } from '../../../components/ui/PeriodSelector';

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
              <Skeleton
                className="w-6 sm:w-8 bg-zinc-800/40"
                style={{ height: `${20 + Math.random() * 60}%` }}
              />
              <Skeleton
                className="w-6 sm:w-8 bg-zinc-800/40"
                style={{ height: `${10 + Math.random() * 50}%` }}
              />
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
            <div
              key={i}
              className="flex items-center justify-between border-b border-border-subtle/50 pb-2.5"
            >
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
    error: upcomingError,
  } = useTransactions('ALL', {
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
    error: historyError,
  } = useTransactions('ALL', {
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
    summaryError || accountsError || categoriesError || upcomingError || historyError;

  if (!user) return null;

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

      const monthName = d
        .toLocaleDateString('pt-BR', { month: 'short' })
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

  const handleRetry = () => {
    queryClient.invalidateQueries();
  };

  return (
    <div className="bg-bg-base min-h-screen text-white pb-16">
      {/* Couple context banner — visible only in COUPLE mode */}
      {isCouple && (
        <div
          className="w-full py-2.5 px-4 flex items-center justify-center gap-2 border-b animate-in fade-in"
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
              {isCouple ? `Finanças de ${user.name} & ${partnerName}` : `Olá, ${user.name}!`}
            </h1>
            <p className="text-zinc-400 text-sm">Acompanhe a sua saúde financeira atual.</p>
          </div>

          {/* Month selector UI */}
          <PeriodSelector
            value={currentMonth}
            onChange={setCurrentMonth}
          />
        </div>

        {/* Loading and error states */}
        {isDashboardLoading ? (
          <DashboardSkeleton />
        ) : dashboardError ? (
          <div className="auth-card p-8 border border-red-500/20 bg-red-500/5 flex flex-col items-center justify-center text-center space-y-4 max-w-lg mx-auto">
            <div className="p-3 bg-red-500/10 text-red-400 rounded-full">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold">Erro ao carregar dados</h3>
              <p className="text-zinc-400 text-sm">
                Não foi possível carregar as informações do dashboard.
              </p>
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
            {/* KPI Cards */}
            <KpiCards
              summary={summary}
              totalBalance={totalBalance}
              totalUnpaidNext7Days={totalUnpaidNext7Days}
              isCouple={isCouple}
            />

            {/* Graphs and Recent Transactions grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <CashFlowChart chartData={chartData} isCouple={isCouple} partnerName={partnerName} />
              <RecentTransactions
                recentTransactions={recentTransactions}
                categories={categories}
              />
            </div>

            {/* Expenses and Budget widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <CategoryExpensesChart
                transactions={historyTransactions}
                categories={categories}
                currentMonth={currentMonth}
              />
              <BudgetProgressList summary={summary} />
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
