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
        <span
          className={cn(
            'font-semibold',
            !hasLimit && 'text-warning',
            hasLimit && !isOverLimit && 'text-success',
            hasLimit && isOverLimit && 'text-danger'
          )}
        >
          {hasLimit ? `${percentage}%` : 'Sem limite'}
        </span>
      </div>
      
      {hasLimit ? (
        <div className="w-full bg-bg-elevated h-2 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              isOverLimit ? 'bg-danger' : 'bg-success'
            )}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      ) : (
        <div className="w-full border border-dashed border-warning/40 bg-warning/5 h-2 rounded-full" />
      )}
    </div>
  );
}
