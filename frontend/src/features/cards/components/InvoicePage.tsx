import { useMemo, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CircleAlert, Plus, Receipt } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/EmptyState';
import { MoneyValue } from '@/components/ui/MoneyValue';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { errorMessage } from '@/services/errors';
import { formatDate, formatMonth } from '@/utils/formatters';
import { useCard, useCurrentInvoice, useInvoice, useInvoices } from '../hooks/useCards';
import type { Invoice } from '../types';
import { InvoiceItems } from './InvoiceItems';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { PurchaseForm } from './PurchaseForm';

const monthOf = (yearMonth: string) => formatMonth(`${yearMonth}-01`);

/** Fatura por ciclo, com navegação entre a anterior e a seguinte (RF-032). */
export function InvoicePage() {
  const { cardId = '', invoiceId } = useParams();
  const card = useCard(cardId);
  const invoices = useInvoices(cardId);
  const current = useCurrentInvoice(cardId);
  const selectedId = invoiceId ?? current.data?.id ?? null;
  const detail = useInvoice(selectedId);
  const [purchasing, setPurchasing] = useState(false);

  // A fatura atual sem compras ainda não existe no banco, mas entra na navegação
  const sequence = useMemo(() => {
    const list = invoices.data ?? [];
    const virtual = current.data && current.data.id === null ? [current.data] : [];
    return [...list, ...virtual].sort((a, b) => a.closingDate.localeCompare(b.closingDate));
  }, [invoices.data, current.data]);

  const invoice = invoiceId ? detail.data?.invoice : current.data;
  const index = invoice ? sequence.findIndex((item) => item.closingDate === invoice.closingDate) : -1;
  const error = [card, invoices, current, detail].find((query) => query.isError)?.error;
  const pathOf = (target: Invoice) => (target.id ? `/cartoes/${cardId}/faturas/${target.id}` : `/cartoes/${cardId}/fatura`);

  return (
    <PageContainer>
      <nav aria-label="Caminho" className="mb-2 text-sm text-text-muted">
        <Link to="/contas" className="hover:underline">
          Contas e cartões
        </Link>
        {card.data && ` › ${card.data.name}`}
      </nav>
      {error ? (
        <Alert variant="destructive">
          <CircleAlert className="h-4 w-4" />
          <AlertDescription>{errorMessage(error)}</AlertDescription>
        </Alert>
      ) : !invoice || !card.data ? (
        <div role="status" aria-label="Carregando fatura" className="space-y-4">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-text-primary">Fatura que vence em {formatDate(invoice.dueDate)}</h1>
                <InvoiceStatusBadge status={invoice.status} />
              </div>
              <p className="text-sm text-text-muted">Fecha em {formatDate(invoice.closingDate)}</p>
            </div>
            <div className="flex items-center gap-2">
              <NavButton to={index > 0 ? pathOf(sequence[index - 1]) : null} label="Fatura anterior">
                <ChevronLeft />
              </NavButton>
              <NavButton to={index >= 0 && index < sequence.length - 1 ? pathOf(sequence[index + 1]) : null} label="Próxima fatura">
                <ChevronRight />
              </NavButton>
              {!card.data.archived && (
                <Button onClick={() => setPurchasing(true)}>
                  <Plus />
                  Nova compra
                </Button>
              )}
            </div>
          </div>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <Summary title="Total">
              <MoneyValue amount={-invoice.total} aria-label="Total da fatura" />
              <p className="text-xs text-text-muted">
                {invoice.itemCount} {invoice.itemCount === 1 ? 'item' : 'itens'}
              </p>
            </Summary>
            <Summary title="Vencimento">
              <p>{formatDate(invoice.dueDate)}</p>
              <p className="text-xs text-text-muted">Fecha em {formatDate(invoice.closingDate)}</p>
            </Summary>
            <Summary title="Competência">
              <p className="capitalize">{monthOf(invoice.competenceMonth)}</p>
              <p className="text-xs text-text-muted">Os itens entram no orçamento deste mês.</p>
            </Summary>
          </div>
          <Card className="border-border-subtle">
            <CardContent className="p-0">
              {invoice.id === null || detail.data?.items.length === 0 ? (
                <EmptyState
                  icon={<Receipt className="h-6 w-6" />}
                  title="Nenhuma compra nesta fatura"
                  description="As compras feitas até o fechamento entram aqui."
                />
              ) : detail.data ? (
                <InvoiceItems items={detail.data.items} />
              ) : (
                <div role="status" aria-label="Carregando itens" className="p-6">
                  <Skeleton className="h-12 w-full" />
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
      <Sheet open={purchasing} onOpenChange={setPurchasing}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader className="mb-6">
            <SheetTitle>Nova compra{card.data ? ` em ${card.data.name}` : ''}</SheetTitle>
            <SheetDescription>A data da compra decide a fatura; parcelada, cada parcela vai para a fatura seguinte.</SheetDescription>
          </SheetHeader>
          {purchasing && <PurchaseForm cardId={cardId} onDone={() => setPurchasing(false)} />}
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
}

function NavButton({ to, label, children }: { to: string | null; label: string; children: ReactNode }) {
  if (!to) {
    return (
      <Button variant="outline" size="icon" aria-label={label} disabled>
        {children}
      </Button>
    );
  }
  return (
    <Button asChild variant="outline" size="icon">
      <Link to={to} aria-label={label}>
        {children}
      </Link>
    </Button>
  );
}

function Summary({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="border-border-subtle">
      <CardContent className="space-y-1 p-5">
        <SectionLabel>{title}</SectionLabel>
        <div className="text-xl font-bold">{children}</div>
      </CardContent>
    </Card>
  );
}
