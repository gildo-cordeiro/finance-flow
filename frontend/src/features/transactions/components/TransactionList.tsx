import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeftRight, Repeat } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { MoneyValue } from '@/components/ui/MoneyValue';
import { cn } from '@/lib/cn';
import { DATE_FIELD_LABELS, type DateField, type Transaction } from '../types';
import { TransactionActions } from './TransactionActions';

const shortDate = (iso: string | null) => (iso ? format(parseISO(iso), 'dd/MM') : '—');
const competenceLabel = (month: string) => format(parseISO(`${month}-01`), 'MMM/yyyy', { locale: ptBR });

function signedAmount(transaction: Transaction) {
  if (transaction.type === 'INCOME') return transaction.amount;
  if (transaction.type === 'EXPENSE') return -transaction.amount;
  return 0;
}

function categoryLabel(transaction: Transaction) {
  if (transaction.type === 'TRANSFER') return transaction.transferDirection === 'IN' ? 'Transferência recebida' : 'Transferência enviada';
  if (!transaction.categoryName) return '';
  return transaction.parentCategoryName
    ? `${transaction.parentCategoryName} › ${transaction.categoryName}`
    : transaction.categoryName;
}

function Description({ transaction }: { transaction: Transaction }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 truncate font-medium text-text-primary">
        {transaction.type === 'TRANSFER' && <ArrowLeftRight className="h-4 w-4 shrink-0 text-text-muted" aria-hidden />}
        <span className="truncate">{transaction.description}</span>
        {transaction.totalInstallments !== null && (
          <span className="rounded bg-bg-elevated px-1.5 text-xs font-semibold text-text-label">
            {transaction.installmentNumber}/{transaction.totalInstallments}
          </span>
        )}
        {transaction.recurring && (
          <span className="inline-flex items-center gap-1 rounded bg-bg-elevated px-1.5 text-xs font-semibold text-text-label">
            <Repeat className="h-3 w-3" aria-hidden />
            Mensal
          </span>
        )}
      </p>
      <p className="truncate text-xs text-text-muted">{categoryLabel(transaction)}</p>
    </div>
  );
}

function Amount({ transaction }: { transaction: Transaction }) {
  return transaction.type === 'TRANSFER' ? (
    <MoneyValue amount={transaction.amount} showSign={false} className="text-text-primary" />
  ) : (
    <MoneyValue amount={signedAmount(transaction)} />
  );
}

interface TransactionListProps {
  transactions: Transaction[];
  dateField: DateField;
  onEdit: (transaction: Transaction) => void;
}

export function TransactionList({ transactions, dateField, onEdit }: TransactionListProps) {
  const highlight = (field: DateField) => (dateField === field ? 'font-semibold text-text-primary' : 'text-text-label');

  return (
    <>
      <ul className="divide-y divide-border-subtle md:hidden">
        {transactions.map((transaction) => (
          <li key={transaction.id} className="flex flex-col gap-2 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <Description transaction={transaction} />
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Amount transaction={transaction} />
                <Badge status={transaction.status} />
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-text-muted">
                {transaction.accountName} · vence {shortDate(transaction.dueDate)} · comp.{' '}
                {competenceLabel(transaction.competenceMonth)}
              </p>
              <TransactionActions transaction={transaction} onEdit={() => onEdit(transaction)} />
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[960px] text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs text-text-muted">
              <th scope="col" className="px-4 py-3 font-semibold">Descrição</th>
              <th scope="col" className="px-4 py-3 font-semibold">Conta</th>
              {(['COMPETENCE', 'DUE', 'PAYMENT'] as DateField[]).map((field) => (
                <th key={field} scope="col" className={cn('px-4 py-3 font-semibold', dateField === field && 'text-brand')}>
                  {DATE_FIELD_LABELS[field]}
                </th>
              ))}
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Valor</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td className="max-w-72 px-4 py-3"><Description transaction={transaction} /></td>
                <td className="px-4 py-3 text-text-label">{transaction.accountName}</td>
                <td className={cn('px-4 py-3', highlight('COMPETENCE'))}>{competenceLabel(transaction.competenceMonth)}</td>
                <td className={cn('px-4 py-3', highlight('DUE'), transaction.status === 'OVERDUE' && 'text-danger')}>
                  {shortDate(transaction.dueDate)}
                </td>
                <td className={cn('px-4 py-3', highlight('PAYMENT'))}>{shortDate(transaction.paymentDate)}</td>
                <td className="px-4 py-3"><Badge status={transaction.status} /></td>
                <td className="px-4 py-3 text-right"><Amount transaction={transaction} /></td>
                <td className="px-2 py-3"><TransactionActions transaction={transaction} onEdit={() => onEdit(transaction)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
