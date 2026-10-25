import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { formatCurrency } from '@/utils/formatters';
import type { DashboardSummary } from '../types';

export function BudgetCard({ budget, month }: { budget: DashboardSummary['budget']; month: string }) {
  return (
    <Card className="border-border-subtle">
      <CardContent className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <SectionLabel>Orçamento do mês</SectionLabel>
            <p className="text-xs text-text-muted">
              {formatCurrency(budget.realized)} realizados de {formatCurrency(budget.planned)} planejados
            </p>
          </div>
          <Link to={`/orcamento?mes=${month}`} className="shrink-0 whitespace-nowrap text-sm font-medium text-brand hover:text-brand-hover">
            Abrir orçamento
          </Link>
        </div>
        {budget.topCategories.length === 0 ? (
          <EmptyState compact title="Nenhum gasto nem planejado neste mês" description="Defina quanto planeja gastar em cada categoria." />
        ) : (
          <ul aria-label="Categorias em destaque" className="space-y-4">
            {budget.topCategories.map((category) => (
              <li key={category.categoryId} className="space-y-1.5">
                <p className="text-sm font-medium text-text-primary">{category.name}</p>
                <ProgressBar value={category.realized} max={category.planned} label={`Progresso de ${category.name}`} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
