import { useState } from 'react';
import { CircleAlert, Copy, PiggyBank } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageContainer } from '@/components/ui/PageContainer';
import { PageHeader } from '@/components/ui/PageHeader';
import { PeriodSelector } from '@/components/ui/PeriodSelector';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/services/errors';
import { formatCurrency, formatMonth, previousMonth } from '@/utils/formatters';
import { useBudget, useCopyBudget } from '../hooks/useBudget';
import { useBudgetMonth } from '../hooks/useBudgetMonth';
import type { Budget, BudgetCategoryType } from '../types';
import { BudgetSummary } from './BudgetSummary';
import { BudgetTable } from './BudgetTable';

const TABS: { type: BudgetCategoryType; label: string }[] = [
  { type: 'EXPENSE', label: 'Despesas' },
  { type: 'INCOME', label: 'Receitas' },
];

const monthName = (month: string) => formatMonth(`${month}-01`);

const hasPlan = (budget: Budget) => budget.totals.expense.planned > 0 || budget.totals.income.planned > 0;

export function BudgetPage() {
  const { month, setMonth } = useBudgetMonth();
  const budget = useBudget(month);
  const copy = useCopyBudget(month);
  const [type, setType] = useState<BudgetCategoryType>('EXPENSE');
  const [showIdle, setShowIdle] = useState(false);
  const [startedEmpty, setStartedEmpty] = useState<string | null>(null);
  const previous = previousMonth(month);

  const copyPrevious = () =>
    copy.mutate(undefined, {
      onSuccess: () => toast.success(`Orçamento de ${monthName(previous)} copiado. O que já estava planejado foi mantido.`),
      onError: (error) => toast.error(errorMessage(error)),
    });

  const data = budget.data;
  const lines = data?.categories.filter((line) => line.type === type) ?? [];
  const active = lines.filter((line) => line.planned !== null || line.realized !== 0);
  const idle = lines.length - active.length;
  const empty = data !== undefined && !hasPlan(data) && startedEmpty !== month;

  return (
    <PageContainer>
      <PageHeader
        title="Orçamento"
        subtitle="Planejado e realizado pela competência"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <PeriodSelector value={month} onChange={setMonth} />
            {data && !empty && (
              <Button variant="outline" onClick={copyPrevious} disabled={copy.isPending}>
                <Copy />
                Copiar do mês anterior
              </Button>
            )}
          </div>
        }
      />
      {budget.isPending && (
        <div role="status" aria-label="Carregando orçamento" className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}
      {budget.isError && (
        <Alert variant="destructive">
          <CircleAlert className="h-4 w-4" />
          <AlertDescription>{errorMessage(budget.error)}</AlertDescription>
        </Alert>
      )}
      {data && empty && (
        <Card className="border-border-subtle">
          <EmptyState
            icon={<PiggyBank className="h-6 w-6" />}
            title={`${capitalize(monthName(month))} ainda não tem orçamento`}
            description={emptyDescription(data, previous)}
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {data.previousMonthPlanned > 0 && (
                  <Button onClick={copyPrevious} disabled={copy.isPending}>
                    Copiar de {monthName(previous)} ({formatCurrency(data.previousMonthPlanned)})
                  </Button>
                )}
                <Button variant="outline" onClick={() => setStartedEmpty(month)}>
                  Começar do zero
                </Button>
              </div>
            }
          />
        </Card>
      )}
      {data && !empty && (
        <>
          <BudgetSummary type={type} totals={type === 'EXPENSE' ? data.totals.expense : data.totals.income} lines={lines} />
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div role="group" aria-label="Tipo de categoria" className="inline-flex gap-0.5 rounded-lg border border-border-subtle bg-bg-base p-0.5">
              {TABS.map((tab) => (
                <button
                  key={tab.type}
                  type="button"
                  aria-pressed={type === tab.type}
                  onClick={() => setType(tab.type)}
                  className={cn(
                    'rounded-md px-3.5 py-1.5 text-sm font-medium text-text-label',
                    type === tab.type && 'bg-bg-elevated font-semibold text-text-primary'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <span className="text-xs text-text-muted">Clique no valor planejado para editar · Enter salva, Esc cancela</span>
          </div>
          <Card className="border-border-subtle">
            <CardContent className="p-0">
              {lines.length === 0 ? (
                <EmptyState compact title="Nenhuma categoria deste tipo" description="Cadastre categorias em Configurações." />
              ) : (
                <BudgetTable lines={showIdle ? lines : active} month={month} />
              )}
              {idle > 0 && (
                <div className="px-4 py-3">
                  <Button variant="ghost" size="sm" className="h-auto whitespace-normal py-1.5 text-left" onClick={() => setShowIdle(!showIdle)}>
                    {showIdle ? 'Esconder' : 'Mostrar'} categorias sem planejado e sem gasto ({idle})
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </PageContainer>
  );
}

function emptyDescription(budget: Budget, previous: string) {
  const parts = [
    budget.previousMonthPlanned > 0
      ? `Copie os valores de ${monthName(previous)} e ajuste o que mudou, ou comece do zero.`
      : 'Defina quanto planeja gastar e receber em cada categoria.',
  ];
  const realized = budget.totals.expense.realized;
  if (realized > 0) {
    parts.push(`Já existem ${formatCurrency(realized)} em despesas com competência em ${monthName(budget.month)}.`);
  }
  return parts.join(' ');
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
