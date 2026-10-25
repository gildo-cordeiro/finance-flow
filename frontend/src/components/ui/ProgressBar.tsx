import { cn } from '@/lib/cn';
import { formatCurrency } from '@/utils/formatters';

interface ProgressBarProps {
  value: number;
  max?: number | null;
  /** Nome acessível da barra, ex.: "Progresso de Mercado". */
  label?: string;
  className?: string;
}

function tone(percentage: number) {
  if (percentage > 100) return { bar: 'bg-danger', text: 'text-danger' };
  if (percentage >= 80) return { bar: 'bg-warning', text: 'text-warning' };
  return { bar: 'bg-success', text: 'text-success' };
}

export function ProgressBar({ value, max, label, className }: ProgressBarProps) {
  if (typeof max !== 'number' || max <= 0) {
    return (
      <div className={cn('flex flex-col gap-1 w-full', className)}>
        <div className="flex justify-between items-center text-xs text-text-muted font-medium">
          <span>Sem limite</span>
        </div>
        <div className="w-full border border-dashed border-border-subtle h-1.5 rounded-full" />
      </div>
    );
  }

  const percentage = Math.round((value / max) * 100);
  const colors = tone(percentage);
  const text = `${formatCurrency(value)} / ${formatCurrency(max)}`;

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)}>
      <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide whitespace-nowrap">
        <span className={colors.text}>{percentage}%</span>
        <span className="text-text-secondary font-normal opacity-40">—</span>
        <span className="text-text-secondary font-normal">{text}</span>
        {percentage > 100 && (
          <span className="text-xs bg-danger/10 text-danger border border-danger/20 rounded px-1 font-bold animate-pulse select-none">
            Estourado
          </span>
        )}
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${percentage}% (${text})`}
        className="relative w-full bg-bg-elevated h-2 rounded-full overflow-hidden"
      >
        <div
          className={cn('h-full rounded-full animate-progress-fill', colors.bar)}
          style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }}
        />
        {percentage > 100 && (
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-foreground/40 animate-pulse" title="Excedido!" />
        )}
      </div>
    </div>
  );
}
