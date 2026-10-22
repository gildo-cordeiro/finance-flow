import { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export type TransactionStatus = 'PLANNED' | 'PAID' | 'PENDING' | 'OVERDUE';

const STATUS_CONFIG: Record<TransactionStatus, { label: string; classes: string }> = {
  PLANNED: { label: 'Planejado', classes: 'bg-info/10 text-info border-info/20' },
  PAID:    { label: 'Pago',      classes: 'bg-success/10 text-success border-success/20' },
  PENDING: { label: 'Pendente',  classes: 'bg-warning/10 text-warning border-warning/20' },
  OVERDUE: { label: 'Atrasado',  classes: 'bg-danger/10 text-danger border-danger/20' },
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: TransactionStatus;
}

export function Badge({ status, className, children, ...props }: BadgeProps) {
  const config = STATUS_CONFIG[status] || { label: status, classes: 'bg-bg-elevated text-text-secondary border-border-subtle' };
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-colors',
        config.classes,
        className
      )}
      {...props}
    >
      {children || config.label}
    </span>
  );
}
