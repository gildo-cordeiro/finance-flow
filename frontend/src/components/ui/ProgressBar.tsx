import { cn } from '../../lib/cn';
import { formatCurrency } from '../../utils/formatters';

interface ProgressBarProps {
  value: number;
  max?: number | null;
  className?: string;
}

export function ProgressBar({ value, max, className }: ProgressBarProps) {
  const hasLimit = typeof max === 'number' && max > 0;
  
  let percentage = 0;
  if (hasLimit && max) {
    percentage = Math.round((value / max) * 100);
  }

  if (!hasLimit) {
    return (
      <div className={cn('flex flex-col gap-1 w-full', className)}>
        <div className="flex justify-between items-center text-[10px] text-text-muted font-medium uppercase tracking-wider">
          <span>Sem limite</span>
        </div>
        <div className="w-full border border-dashed border-zinc-800 bg-zinc-900/10 h-1.5 rounded-[9999px]" />
      </div>
    );
  }

  const isOverLimit = percentage >= 100;

  // Determine color of progress bar based on 3 states:
  // - Normal (< 80%): #7C5CFC (bg-brand)
  // - Warning (80–99%): #F59E0B (bg-warning)
  // - Over-budget (>= 100%): #EF4444 (bg-danger)
  let barColorClass = 'bg-brand';
  let textColorClass = 'text-brand';
  if (percentage >= 80 && percentage < 100) {
    barColorClass = 'bg-warning';
    textColorClass = 'text-warning';
  } else if (percentage >= 100) {
    barColorClass = 'bg-danger';
    textColorClass = 'text-danger';
  }

  const formattedValue = formatCurrency(value);
  const formattedMax = formatCurrency(max || 0);
  const percentageVal = Math.min(percentage, 100);
  const animationName = `fillProgress-${value}-${max || 0}`;
  const fillClassName = `progress-bar-fill-${value}-${max || 0}`;

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ${animationName} {
          from { width: 0%; }
          to { width: ${percentageVal}%; }
        }
        .${fillClassName} {
          width: ${percentageVal}%;
          animation: ${animationName} 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      ` }} />

      <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide whitespace-nowrap">
        <span className={textColorClass}>{percentage}%</span>
        <span className="text-text-secondary font-normal opacity-40">—</span>
        <span className="text-text-secondary font-normal">
          {formattedValue} / {formattedMax}
        </span>
        {isOverLimit && (
          <span className="text-[9px] bg-danger/10 text-danger border border-danger/20 rounded px-1 font-bold animate-pulse select-none">
            Estourado
          </span>
        )}
      </div>
      <div className="relative w-full bg-bg-elevated h-[8px] rounded-[9999px] overflow-hidden">
        <div className={cn('h-full rounded-[9999px]', barColorClass, fillClassName)} />
        {/* Overflow indicator when percentage > 100% */}
        {percentage > 100 && (
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/40 animate-pulse" title="Excedido!" />
        )}
      </div>
    </div>
  );
}


