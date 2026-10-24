import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { MoneyValue } from '@/components/ui/MoneyValue';
import { SectionLabel } from '@/components/ui/SectionLabel';
import type { AccountBalance } from '../types';

export function AccountsCard({ accounts }: { accounts: AccountBalance[] }) {
  return (
    <Card className="border-border-subtle">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <SectionLabel>Contas</SectionLabel>
          <Link to="/contas" className="shrink-0 whitespace-nowrap text-sm font-medium text-brand hover:text-brand-hover">
            Gerenciar
          </Link>
        </div>
        <ul aria-label="Saldos das contas" className="divide-y divide-border-subtle">
          {accounts.map((account) => (
            <li key={account.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text-primary">{account.name}</p>
                <p className="text-xs text-text-muted">{account.savings ? 'Poupança' : 'Conta corrente'}</p>
              </div>
              <MoneyValue amount={account.balance} showSign={account.balance < 0} className="text-sm" aria-label={`Saldo de ${account.name}`} />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
