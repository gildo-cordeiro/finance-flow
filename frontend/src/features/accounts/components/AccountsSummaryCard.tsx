import { Card, CardContent } from '@/components/ui/card';
import { MoneyValue } from '@/components/ui/MoneyValue';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAccountsSummary } from '../hooks/useAccounts';

export function AccountsSummaryCard() {
  const summary = useAccountsSummary();
  const count = summary.data?.accountCount ?? 0;
  if (summary.isError || (summary.data && count === 0)) return null;

  return (
    <Card className="mb-6 border-border-subtle sm:max-w-xs">
      <CardContent className="space-y-1 p-5">
        <SectionLabel>Saldo em contas</SectionLabel>
        {summary.data ? (
          <>
            <p className="text-2xl font-bold">
              <MoneyValue
                amount={summary.data.balance}
                showSign={summary.data.balance < 0}
                className={summary.data.balance < 0 ? undefined : 'text-text-primary'}
                aria-label="Saldo em contas"
              />
            </p>
            <p className="text-xs text-text-muted">
              Hoje, em {count} {count === 1 ? 'conta ativa' : 'contas ativas'}
            </p>
          </>
        ) : (
          <Skeleton role="status" aria-label="Carregando saldo" className="h-8 w-40" />
        )}
      </CardContent>
    </Card>
  );
}
