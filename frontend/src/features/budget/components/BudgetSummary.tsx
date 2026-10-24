import { Card, CardContent } from '@/components/ui/card';
import { MoneyValue } from '@/components/ui/MoneyValue';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { formatCurrency } from '@/utils/formatters';
import type { BudgetCategoryType, BudgetLine, BudgetTotals } from '../types';

interface BudgetSummaryProps {
  type: BudgetCategoryType;
  totals: BudgetTotals;
  lines: BudgetLine[];
}

export function BudgetSummary({ type, totals, lines }: BudgetSummaryProps) {
  const expense = type === 'EXPENSE';
  const planned = lines.filter((line) => line.planned !== null).length;
  const over = lines.filter((line) => line.percentUsed !== null && line.percentUsed > 100).length;
  const sign = expense ? -1 : 1;

  return (
    <section aria-label="Resumo do orçamento" className="mb-6 grid gap-4 sm:grid-cols-3">
      <Card className="border-border-subtle">
        <CardContent className="space-y-1 p-5">
          <SectionLabel>Planejado</SectionLabel>
          <p className="text-2xl font-bold tabular-nums text-text-primary">
            <MoneyValue amount={totals.planned} showSign={false} className="text-text-primary" aria-label="Total planejado" />
          </p>
          <p className="text-xs text-text-muted">
            Em {planned} {planned === 1 ? 'categoria' : 'categorias'} de {expense ? 'despesa' : 'receita'}
          </p>
        </CardContent>
      </Card>
      <Card className="border-border-subtle">
        <CardContent className="space-y-1 p-5">
          <SectionLabel>Realizado</SectionLabel>
          <p className="text-2xl font-bold">
            <MoneyValue amount={sign * totals.realized} aria-label="Total realizado" />
          </p>
          <p className="text-xs text-text-muted">
            {totals.percentUsed === null ? 'Sem planejado no mês' : `${totals.percentUsed}% do planejado`}
          </p>
        </CardContent>
      </Card>
      <Card className="border-border-subtle">
        <CardContent className="space-y-1 p-5">
          <SectionLabel>{expense ? 'Saldo do orçamento' : 'Falta receber'}</SectionLabel>
          <p className="text-2xl font-bold">
            <MoneyValue amount={totals.remaining} aria-label="Saldo do orçamento" />
          </p>
          <p className="text-xs text-text-muted">
            {expense
              ? over === 0
                ? 'Nenhuma categoria acima do limite'
                : `${over} ${over === 1 ? 'categoria acima' : 'categorias acima'} do limite`
              : `${formatCurrency(totals.realizedPaid)} já recebido`}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

