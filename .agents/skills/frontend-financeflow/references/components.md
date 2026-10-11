# Componentes base (ui/)

> Referência da skill `frontend-financeflow`. Leia só quando a tarefa envolver este assunto. Regras gerais e convenções confirmadas: `../SKILL.md`.

## 2. Componentes Base

### Button

```tsx
// components/ui/Button.tsx
import { cn } from '@/lib/cn';
import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900',
        // Variantes
        variant === 'primary'   && 'bg-violet-600 text-white hover:bg-violet-500 focus:ring-violet-500 shadow-lg shadow-violet-500/25',
        variant === 'secondary' && 'bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700 focus:ring-zinc-600',
        variant === 'ghost'     && 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 focus:ring-zinc-700',
        variant === 'danger'    && 'bg-red-600/10 text-red-400 border border-red-500/20 hover:bg-red-600/20 focus:ring-red-500',
        // Tamanhos
        size === 'sm' && 'px-3 py-1.5 text-xs',
        size === 'md' && 'px-4 py-2 text-sm',
        size === 'lg' && 'px-6 py-3 text-base',
        // Estados
        (disabled || loading) && 'cursor-not-allowed opacity-50',
        className
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      )}
      {children}
    </button>
  );
}
```

### Input

```tsx
// components/ui/Input.tsx
import { cn } from '@/lib/cn';
import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[13px] font-semibold text-text-label">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={cn(
          'w-full rounded-xl bg-zinc-800/50 border px-3.5 py-2.5 text-sm text-zinc-100',
          'placeholder:text-zinc-500 transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          error
            ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
            : 'border-zinc-700/50 focus:border-violet-500 focus:ring-violet-500/20',
          className
        )}
        {...props}
      />
      {hint && !error && <p className="text-xs text-zinc-500">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';
```

### Card

```tsx
// components/ui/Card.tsx
import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('bg-bg-surface border border-border-subtle rounded-xl p-5', className)}
      {...props}
    >
      {children}
    </div>
  )
);
```

### Badge

```tsx
// components/ui/Badge.tsx
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
    <span className={cn('inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold border', config.classes, className)} {...props}>
      {children || config.label}
    </span>
  );
}
```

### ProgressBar

```tsx
// components/ui/ProgressBar.tsx
import { cn } from '../../lib/cn';

interface ProgressBarProps {
  value: number;
  max?: number | null;
  className?: string;
}

export function ProgressBar({ value, max, className }: ProgressBarProps) {
  const hasLimit = typeof max === 'number' && max > 0;
  let percentage = 0;
  let isOverLimit = false;

  if (hasLimit && max) {
    percentage = Math.round((value / max) * 100);
    isOverLimit = value > max;
  }

  return (
    <div className={cn('space-y-1.5 w-full', className)}>
      <div className="flex justify-between items-center text-xs">
        <span className="text-text-secondary font-medium">Progresso</span>
        <span className={cn('font-semibold', !hasLimit && 'text-warning', hasLimit && !isOverLimit && 'text-success', hasLimit && isOverLimit && 'text-danger')}>
          {hasLimit ? `${percentage}%` : 'Sem limite'}
        </span>
      </div>
      {hasLimit ? (
        <div className="w-full bg-bg-elevated h-2 rounded-full overflow-hidden">
          <div className={cn('h-full rounded-full transition-all duration-300', isOverLimit ? 'bg-danger' : 'bg-success')} style={{ width: `${Math.min(percentage, 100)}%` }} />
        </div>
      ) : (
        <div className="w-full border border-dashed border-warning/40 bg-warning/5 h-2 rounded-full" />
      )}
    </div>
  );
}
```

### MoneyValue

```tsx
// components/ui/MoneyValue.tsx
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
```

### SectionLabel

```tsx
// components/ui/SectionLabel.tsx
import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/cn';

interface SectionLabelProps extends HTMLAttributes<HTMLSpanElement> {}

export const SectionLabel = forwardRef<HTMLSpanElement, SectionLabelProps>(
  ({ className, children, ...props }, ref) => (
    <span ref={ref} className={cn('text-[13px] font-semibold text-text-label', className)} {...props}>
      {children}
    </span>
  )
);
```

### Skeleton Loader

```tsx
// components/ui/Skeleton.tsx
import { cn } from '@/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-xl bg-zinc-800/60', className)} />
  );
}

// Skeleton específico de card de transação
export function TransactionCardSkeleton() {
  return (
    <div className="glassmorphism p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-6 w-24" />
    </div>
  );
}
```

### Empty State

```tsx
// components/ui/EmptyState.tsx
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="mb-4 rounded-2xl bg-zinc-800/50 p-4 text-zinc-500">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-zinc-300">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-text-muted max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
```
