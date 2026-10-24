import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MoneyValue } from '@/components/ui/MoneyValue';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { formatCurrency } from '@/utils/formatters';
import type { DashboardSummary } from '../types';

export function SummaryCards({ summary }: { summary: DashboardSummary }) {
  const count = summary.accounts.length;
  return (
    <section aria-label="Resumo do mês" className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        title="Receitas"
        value={<MoneyValue amount={summary.income.realized} aria-label="Receitas do mês" />}
        hint={`${formatCurrency(summary.income.pending)} ainda previstos`}
      />
      <SummaryCard
        title="Despesas"
        value={<MoneyValue amount={-summary.expense.realized} aria-label="Despesas do mês" />}
        hint={`${formatCurrency(summary.expense.pending)} ainda a pagar`}
      />
      <SummaryCard
        title="Resultado do mês"
        value={<MoneyValue amount={summary.balance} aria-label="Resultado do mês" />}
        hint="Receitas menos despesas da competência"
      />
      <SummaryCard
        title="Saldo em contas"
        value={
          <MoneyValue amount={summary.accountsBalance} showSign={summary.accountsBalance < 0} className={summary.accountsBalance < 0 ? undefined : 'text-text-primary'} aria-label="Saldo em contas" />
        }
        hint={`Hoje, em ${count} ${count === 1 ? 'conta' : 'contas'}`}
      />
    </section>
  );
}

function SummaryCard({ title, value, hint }: { title: string; value: ReactNode; hint: string }) {
  return (
    <Card className="border-border-subtle">
      <CardContent className="space-y-1 p-5">
        <SectionLabel>{title}</SectionLabel>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-text-muted">{hint}</p>
      </CardContent>
    </Card>
  );
}
