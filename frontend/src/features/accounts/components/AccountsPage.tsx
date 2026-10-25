import { useState, type ReactNode } from 'react';
import { CircleAlert, Plus, Wallet } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArchivedToggle } from '@/components/ui/ArchivedToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageContainer } from '@/components/ui/PageContainer';
import { PageHeader } from '@/components/ui/PageHeader';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { errorMessage } from '@/services/errors';
import { useAccounts } from '../hooks/useAccounts';
import type { Account } from '../types';
import { AccountForm } from './AccountForm';
import { AccountRow } from './AccountRow';
import { AccountsSummaryCard } from './AccountsSummaryCard';

type Editing = { account?: Account } | null;

interface AccountsPageProps {
  /** Seção dos cartões, que vem da feature própria (F1-14). */
  cards?: ReactNode;
}

export function AccountsPage({ cards }: AccountsPageProps) {
  const [includeArchived, setIncludeArchived] = useState(false);
  const [editing, setEditing] = useState<Editing>(null);
  const accounts = useAccounts(includeArchived);
  const bankAccounts = accounts.data?.filter((account) => account.type !== 'CREDIT_CARD');

  return (
    <PageContainer>
      <PageHeader
        title="Contas e cartões"
        actions={
          <Button onClick={() => setEditing({})}>
            <Plus />
            Nova conta
          </Button>
        }
      />
      <AccountsSummaryCard />
      <Card className="border-border-subtle">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-5 py-4">
          <h2 className="text-[13px] font-semibold text-text-label">Contas</h2>
          <ArchivedToggle
            id="show-archived-accounts"
            label="Mostrar arquivadas"
            checked={includeArchived}
            onCheckedChange={setIncludeArchived}
          />
        </div>
        <CardContent className="p-0">
          {accounts.isPending && (
            <div role="status" aria-label="Carregando contas" className="space-y-3 p-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}
          {accounts.isError && (
            <div className="p-6">
              <Alert variant="destructive">
                <CircleAlert className="h-4 w-4" />
                <AlertDescription>{errorMessage(accounts.error)}</AlertDescription>
              </Alert>
            </div>
          )}
          {bankAccounts?.length === 0 && (
            <EmptyState
              icon={<Wallet className="h-6 w-6" />}
              title="Nenhuma conta cadastrada"
              description="Cadastre sua conta corrente ou poupança para começar a lançar transações."
            />
          )}
          {bankAccounts && bankAccounts.length > 0 && (
            <ul className="divide-y divide-border-subtle">
              {bankAccounts.map((account) => (
                <AccountRow key={account.id} account={account} onEdit={() => setEditing({ account })} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      {cards}
      <Sheet open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader className="mb-6">
            <SheetTitle>{editing?.account ? 'Editar conta' : 'Nova conta'}</SheetTitle>
            <SheetDescription>Conta corrente ou poupança. Cartões de crédito têm cadastro próprio, logo abaixo.</SheetDescription>
          </SheetHeader>
          {editing && <AccountForm account={editing.account} onDone={() => setEditing(null)} />}
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
}
