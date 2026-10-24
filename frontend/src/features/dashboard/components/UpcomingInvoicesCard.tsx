import { CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/EmptyState';
import { MoneyValue } from '@/components/ui/MoneyValue';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { formatDate } from '@/utils/formatters';
import type { UpcomingInvoice } from '../types';

export function UpcomingInvoicesCard({ invoices }: { invoices: UpcomingInvoice[] }) {
  return (
    <Card className="border-border-subtle">
      <CardContent className="p-5">
        <div className="mb-3">
          <SectionLabel>Faturas a vencer</SectionLabel>
          <p className="text-xs text-text-muted">Vencidas e dos próximos 30 dias</p>
        </div>
        {invoices.length === 0 ? (
          <EmptyState compact icon={<CreditCard className="h-6 w-6" />} title="Nenhuma fatura em aberto" />
        ) : (
          <ul aria-label="Faturas a vencer" className="divide-y divide-border-subtle">
            {invoices.map((invoice) => (
              <li key={invoice.id}>
                <Link
                  to={`/cartoes/${invoice.cardId}/faturas/${invoice.id}`}
                  className="flex items-center justify-between gap-3 py-2.5 hover:opacity-80"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary">{invoice.cardName}</p>
                    <p className={invoice.overdue ? 'text-xs text-danger' : 'text-xs text-text-muted'}>
                      {invoice.overdue ? 'Venceu' : 'Vence'} {formatDate(invoice.dueDate)}
                      {invoice.partiallyPaid && ' · paga em parte'}
                    </p>
                  </div>
                  <MoneyValue amount={-invoice.openAmount} className="text-sm" aria-label={`Em aberto na fatura de ${invoice.cardName}`} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
