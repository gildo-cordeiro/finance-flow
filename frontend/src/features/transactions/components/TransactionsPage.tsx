import { useState } from 'react';
import { ArrowLeftRight, CircleAlert, Plus } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/EmptyState';
import { MoneyValue } from '@/components/ui/MoneyValue';
import { PageContainer } from '@/components/ui/PageContainer';
import { PageHeader } from '@/components/ui/PageHeader';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/services/errors';
import { useTransactionFilters } from '../hooks/useTransactionFilters';
import { useTransactions } from '../hooks/useTransactions';
import type { Transaction } from '../types';
import { TransactionFiltersBar } from './TransactionFiltersBar';
import { TransactionForm } from './TransactionForm';
import { TransactionList } from './TransactionList';

type Editing = { transaction?: Transaction } | null;

export function TransactionsPage() {
  const { filters, setFilters, hasExtraFilters } = useTransactionFilters();
  const transactions = useTransactions(filters);
  // `?nova=1` abre o formulário direto, para o atalho "Nova transação" do Painel
  const [params] = useSearchParams();
  const [editing, setEditing] = useState<Editing>(() => (params.has('nova') ? {} : null));
  const items = transactions.data?.pages.flatMap((page) => page.items) ?? [];
  // Os totais vêm da API e valem para a seleção inteira, não só para as páginas carregadas
  const totals = transactions.data?.pages[0]?.totals;

  return (
    <PageContainer>
      <PageHeader
        title="Transações"
        actions={
          <Button onClick={() => setEditing({})}>
            <Plus />
            Nova transação
          </Button>
        }
      />
      <TransactionFiltersBar
        filters={filters}
        onChange={setFilters}
        canClear={hasExtraFilters}
        onClear={() => setFilters({ type: null, accountId: null, categoryId: null, status: null, q: '' })}
      />
      {totals && (
        <section aria-label="Totais da seleção" className="mb-4 grid grid-cols-2 items-baseline gap-x-4 gap-y-1 px-1 text-sm text-text-label sm:flex sm:flex-wrap sm:gap-x-6">
          <span className="col-span-2 text-xs text-text-muted">
            {totals.count} {totals.count === 1 ? 'transação' : 'transações'}
          </span>
          <span className="flex flex-col sm:block">
            Receitas <MoneyValue amount={totals.income} aria-label="Total de receitas" />
          </span>
          <span className="flex flex-col sm:block">
            Despesas <MoneyValue amount={-totals.expense} aria-label="Total de despesas" />
          </span>
          <span className="flex flex-col sm:block">
            Resultado <MoneyValue amount={totals.balance} aria-label="Resultado da seleção" />
          </span>
          <span className="col-span-2 text-xs text-text-muted">Transferências não entram nos totais</span>
        </section>
      )}
      <Card className="border-border-subtle">
        <CardContent
          className={cn('p-0 transition-opacity duration-200', transactions.isPlaceholderData && 'opacity-60')}
          aria-busy={transactions.isFetching}
        >
          {transactions.isPending && (
            <div role="status" aria-label="Carregando transações" className="space-y-3 p-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}
          {transactions.isError && (
            <div className="p-6">
              <Alert variant="destructive">
                <CircleAlert className="h-4 w-4" />
                <AlertDescription>{errorMessage(transactions.error)}</AlertDescription>
              </Alert>
            </div>
          )}
          {transactions.isSuccess && items.length === 0 && (
            <EmptyState
              icon={<ArrowLeftRight className="h-6 w-6" />}
              title="Nenhuma transação encontrada"
              description={
                hasExtraFilters
                  ? 'Nenhuma transação combina com os filtros. Tente limpar alguns.'
                  : 'Lance a primeira receita ou despesa deste mês.'
              }
            />
          )}
          {items.length > 0 && (
            <TransactionList
              transactions={items}
              dateField={filters.dateField}
              onEdit={(transaction) => setEditing({ transaction })}
            />
          )}
          {transactions.hasNextPage && (
            <div className="flex items-center justify-between border-t border-border-subtle px-4 py-3">
              <span className="text-xs text-text-muted">
                Mostrando {items.length} de {totals?.count}
              </span>
              <Button variant="outline" size="sm" onClick={() => transactions.fetchNextPage()} disabled={transactions.isFetchingNextPage}>
                Carregar mais
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      <Sheet open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader className="mb-6">
            <SheetTitle>{editing?.transaction ? 'Editar transação' : 'Nova transação'}</SheetTitle>
            <SheetDescription>A competência é sugerida pelas datas; você pode trocar.</SheetDescription>
          </SheetHeader>
          {editing && <TransactionForm transaction={editing.transaction} onDone={() => setEditing(null)} />}
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
}
