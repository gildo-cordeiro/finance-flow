import { CircleCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/EmptyState';
import { MoneyValue } from '@/components/ui/MoneyValue';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { errorMessage } from '@/services/errors';
import { formatDate } from '@/utils/formatters';
import { usePayFromDashboard } from '../hooks/useDashboard';
import type { DashboardSummary } from '../types';

export function PayablesCard({ payables }: { payables: DashboardSummary['payables'] }) {
  const pay = usePayFromDashboard();

  const onPay = (id: string, description: string) =>
    pay.mutate(id, {
      onSuccess: () => toast.success(`${description} marcada como paga.`),
      onError: (error) => toast.error(errorMessage(error)),
    });

  return (
    <Card className="border-border-subtle">
      <CardContent className="p-0">
        <div className="flex items-start justify-between gap-3 p-5 pb-3">
          <div>
            <SectionLabel>A pagar</SectionLabel>
            <p className="text-xs text-text-muted">Atrasadas e vencimentos dos próximos 7 dias</p>
          </div>
          <Link to="/transacoes?data=vencimento" className="shrink-0 whitespace-nowrap text-sm font-medium text-brand hover:text-brand-hover">
            Ver todas
          </Link>
        </div>
        {payables.overdueCount > 0 && (
          <p role="status" className="mx-5 mb-3 rounded-md border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
            {payables.overdueCount === 1 ? '1 despesa atrasada' : `${payables.overdueCount} despesas atrasadas`}
          </p>
        )}
        {payables.items.length === 0 ? (
          <EmptyState compact icon={<CircleCheck className="h-6 w-6" />} title="Nada a pagar nos próximos 7 dias" />
        ) : (
          <ul aria-label="Despesas a pagar">
            {payables.items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border-subtle px-5 py-3">
                <div className="min-w-0 basis-full sm:basis-auto sm:flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">{item.description}</p>
                  <p className="truncate text-xs text-text-muted">
                    {[item.categoryName, item.accountName].filter(Boolean).join(' · ')} ·{' '}
                    {item.overdue ? 'venceu' : 'vence'} {formatDate(item.dueDate)}
                  </p>
                </div>
                <Badge status={item.overdue ? 'OVERDUE' : 'PENDING'} />
                <MoneyValue amount={-item.amount} className="ml-auto text-right text-sm sm:ml-0 sm:w-28" />
                <Button
                  size="sm"
                  variant="outline"
                  aria-label={`Pagar ${item.description}`}
                  disabled={pay.isPending}
                  onClick={() => onPay(item.id, item.description)}
                >
                  Pagar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
