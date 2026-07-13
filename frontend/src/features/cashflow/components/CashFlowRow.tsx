import { CalendarDays, Calendar } from 'lucide-react';
import { cn } from '../../../lib/cn';

interface CashFlowRowProps {
  type: 'daily' | 'weekly' | 'monthly';
  dateDisplay: string;
  income: number;
  expense: number;
  balance: number;
  currency: string;
}

export function CashFlowRow({
  type,
  dateDisplay,
  income,
  expense,
  balance,
  currency,
}: CashFlowRowProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL',
    }).format(value);
  };

  const renderPeriodCell = () => {
    if (type === 'weekly') {
      return (
        <td className="p-4 font-medium flex items-center gap-2 text-text-primary">
          <CalendarDays className="w-4 h-4 text-brand" />
          <span>Semana de {dateDisplay}</span>
        </td>
      );
    }
    if (type === 'monthly') {
      return (
        <td className="p-4 font-medium flex items-center gap-2 text-text-primary">
          <Calendar className="w-4 h-4 text-brand" />
          <span>{dateDisplay}</span>
        </td>
      );
    }
    // daily
    return <td className="p-4 font-medium text-text-primary">{dateDisplay}</td>;
  };

  return (
    <tr className="hover:bg-bg-elevated/20 transition-colors">
      {renderPeriodCell()}
      <td className="p-4 text-right text-success font-semibold">
        {income > 0 ? `+ ${formatCurrency(income)}` : '-'}
      </td>
      <td className="p-4 text-right text-danger font-semibold">
        {expense > 0 ? `- ${formatCurrency(expense)}` : '-'}
      </td>
      <td
        className={cn(
          'p-4 text-right font-bold',
          balance < 0 ? 'text-danger' : 'text-text-primary'
        )}
      >
        {formatCurrency(balance)}
      </td>
      <td className="p-4 text-center">
        <span
          className={cn(
            'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium border',
            balance < 0
              ? 'bg-danger/10 text-danger border-danger/20'
              : 'bg-success/10 text-success border-success/20'
          )}
        >
          {balance < 0 ? 'Aperto' : 'Positivo'}
        </span>
      </td>
    </tr>
  );
}
