import { useState } from 'react';
import { CircleAlert, Plus, Wallet } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/EmptyState';
import { Label } from '@/components/ui/label';
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

export function AccountsPage() {
  const [includeArchived, setIncludeArchived] = useState(false);
  const [editing, setEditing] = useState<Editing>(null);
  const accounts = useAccounts(includeArchived);

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
      <div className="mb-4 flex items-center gap-2">
        <Checkbox
          id="show-archived-accounts"
          checked={includeArchived}
          onCheckedChange={(checked) => setIncludeArchived(checked === true)}
        />
        <Label htmlFor="show-archived-accounts">Mostrar arquivadas</Label>
      </div>
      <Card className="border-border-subtle">
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
          {accounts.data?.length === 0 && (
            <EmptyState
              icon={<Wallet className="h-6 w-6" />}
              title="Nenhuma conta cadastrada"
              description="Cadastre sua conta corrente ou poupança para começar a lançar transações."
            />
          )}
          {accounts.data && accounts.data.length > 0 && (
            <ul className="divide-y divide-border-subtle">
              {accounts.data.map((account) => (
                <AccountRow key={account.id} account={account} onEdit={() => setEditing({ account })} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <Sheet open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader className="mb-6">
            <SheetTitle>{editing?.account ? 'Editar conta' : 'Nova conta'}</SheetTitle>
            <SheetDescription>Conta corrente ou poupança. Cartões de crédito chegam em breve.</SheetDescription>
          </SheetHeader>
          {editing && <AccountForm account={editing.account} onDone={() => setEditing(null)} />}
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
}
