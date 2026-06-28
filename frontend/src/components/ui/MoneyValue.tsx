import { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';
import { formatCurrency } from '../../utils/formatters';

interface MoneyValueProps extends HTMLAttributes<HTMLSpanElement> {
  amount: number;
  showSign?: boolean;
}

export function MoneyValue({ amount, showSign = true, className, ...props }: MoneyValueProps) {
  let colorClass = 'text-text-primary';
  let formattedValue = '';

  const absValue = Math.abs(amount);
  const formattedAbs = formatCurrency(absValue);

  if (amount > 0) {
    colorClass = 'text-success';
    formattedValue = showSign ? `+${formattedAbs}` : formattedAbs;
  } else if (amount < 0) {
    colorClass = 'text-danger';
    formattedValue = showSign ? `-${formattedAbs}` : formattedAbs;
  } else {
    colorClass = 'text-text-primary';
    formattedValue = formattedAbs;
  }

  return (
    <span className={cn('font-semibold tabular-nums', colorClass, className)} {...props}>
      {formattedValue}
    </span>
  );
}
