import { CircleAlert, Plus, Wallet } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageContainer } from '@/components/ui/PageContainer';
import { PageHeader } from '@/components/ui/PageHeader';
import { PeriodSelector } from '@/components/ui/PeriodSelector';
import { Skeleton } from '@/components/ui/Skeleton';
import { errorMessage } from '@/services/errors';
import { currentCompetenceMonth, formatMonth } from '@/utils/formatters';
import { useDashboard } from '../hooks/useDashboard';
import { AccountsCard } from './AccountsCard';
import { BudgetCard } from './BudgetCard';
import { PayablesCard } from './PayablesCard';
import { SummaryCards } from './SummaryCards';
import { UpcomingInvoicesCard } from './UpcomingInvoicesCard';

export function DashboardPage() {
  const [params, setParams] = useSearchParams();
  const value = params.get('mes');
  const month = value && /^\d{4}-\d{2}$/.test(value) ? value : currentCompetenceMonth();
  const dashboard = useDashboard(month);
  const summary = dashboard.data;

  return (
    <PageContainer>
      <PageHeader
        title="Painel"
        subtitle={`Resumo da competência de ${formatMonth(`${month}-01`)}`}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <PeriodSelector value={month} onChange={(next) => setParams({ mes: next }, { replace: true })} />
            <Button asChild>
              <Link to="/transacoes?nova=1">
                <Plus />
                Nova transação
              </Link>
            </Button>
          </div>
        }
      />
      {dashboard.isPending && (
        <div role="status" aria-label="Carregando painel" className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}
      {dashboard.isError && (
        <Alert variant="destructive">
          <CircleAlert className="h-4 w-4" />
          <AlertDescription>{errorMessage(dashboard.error)}</AlertDescription>
        </Alert>
      )}
      {summary && summary.accounts.length === 0 && (
        <Card className="border-border-subtle">
          <EmptyState
            icon={<Wallet className="h-6 w-6" />}
            title="Cadastre sua primeira conta"
            description="Com uma conta cadastrada, o painel mostra o saldo, as despesas a pagar e o resultado do mês."
            action={
              <Button asChild>
                <Link to="/contas">Cadastrar conta</Link>
              </Button>
            }
          />
        </Card>
      )}
      {summary && summary.accounts.length > 0 && (
        <>
          <SummaryCards summary={summary} />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="space-y-6">
              <PayablesCard payables={summary.payables} />
              <BudgetCard budget={summary.budget} month={summary.month} />
            </div>
            <div className="space-y-6">
              <UpcomingInvoicesCard invoices={summary.upcomingInvoices} />
              <AccountsCard accounts={summary.accounts} />
            </div>
          </div>
        </>
      )}
    </PageContainer>
  );
}
