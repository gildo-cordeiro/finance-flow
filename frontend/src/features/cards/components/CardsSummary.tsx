import { Card, CardContent } from '@/components/ui/card';
import { MoneyValue } from '@/components/ui/MoneyValue';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/utils/formatters';
import { useCards, useCurrentInvoices } from '../hooks/useCards';

/** Faturas atuais e limite disponível, ao lado do saldo em "Contas e cartões" (RF-030). */
export function CardsSummary() {
  const cards = useCards(false);
  const invoices = useCurrentInvoices(cards.data?.map((card) => card.id) ?? []);
  if (cards.isError || cards.data?.length === 0) return null;

  const loaded = cards.data !== undefined && invoices.every((invoice) => invoice.data !== undefined);
  const open = invoices.reduce((sum, invoice) => sum + (invoice.data?.openAmount ?? 0), 0);
  const limit = cards.data?.reduce((sum, card) => sum + card.creditLimit, 0) ?? 0;
  const available = cards.data?.reduce((sum, card) => sum + card.available, 0) ?? 0;
  const count = cards.data?.length ?? 0;

  return (
    <>
      <Card className="border-border-subtle">
        <CardContent className="space-y-1 p-4 sm:p-5">
          <SectionLabel>Faturas atuais</SectionLabel>
          {loaded ? (
            <>
              <p className="text-xl font-bold sm:text-2xl">
                <MoneyValue amount={-open} aria-label="Faturas atuais em aberto" />
              </p>
              <p className="text-xs text-text-muted">Em aberto, {count === 1 ? 'em 1 cartão' : `em ${count} cartões`}</p>
            </>
          ) : (
            <Skeleton role="status" aria-label="Carregando faturas" className="h-8 w-32" />
          )}
        </CardContent>
      </Card>
      <Card className="border-border-subtle">
        <CardContent className="space-y-1 p-4 sm:p-5">
          <SectionLabel>Limite disponível</SectionLabel>
          {cards.data ? (
            <>
              <p className="text-xl font-bold sm:text-2xl">
                <MoneyValue
                  amount={available}
                  showSign={available < 0}
                  className={available < 0 ? undefined : 'text-text-primary'}
                  aria-label="Limite disponível"
                />
              </p>
              <p className="text-xs text-text-muted">de {formatCurrency(limit)}</p>
            </>
          ) : (
            <Skeleton role="status" aria-label="Carregando limite" className="h-8 w-32" />
          )}
        </CardContent>
      </Card>
    </>
  );
}
