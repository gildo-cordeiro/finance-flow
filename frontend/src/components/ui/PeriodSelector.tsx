import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn';
import { format, addMonths, subMonths, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PeriodSelectorProps {
  value: string; // YYYY-MM
  onChange: (value: string) => void;
  className?: string;
}

export function PeriodSelector({ value, onChange, className }: PeriodSelectorProps) {
  const [year, month] = value.split('-').map(Number);
  const currentDate = new Date(year, month - 1, 1);
  const today = new Date();

  const isCurrentMonth = isSameMonth(currentDate, today);

  const handlePrevMonth = () => {
    const newDate = subMonths(currentDate, 1);
    onChange(format(newDate, 'yyyy-MM'));
  };

  const handleNextMonth = () => {
    const newDate = addMonths(currentDate, 1);
    onChange(format(newDate, 'yyyy-MM'));
  };

  const handleToday = () => {
    if (!isCurrentMonth) {
      onChange(format(today, 'yyyy-MM'));
    }
  };

  const monthLabel = format(currentDate, 'MMMM \'de\' yyyy', { locale: ptBR });
  const capitalizedLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  return (
    <div className={cn("flex items-center gap-2 bg-bg-surface border border-border-subtle rounded-xl p-1 h-[40px] shrink-0", className)}>
      <button
        onClick={handlePrevMonth}
        className="p-1.5 hover:bg-bg-elevated rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer"
        aria-label="Mês anterior"
        title="Mês Anterior"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <span 
        className="flex-1 text-sm font-semibold min-w-[140px] text-center text-text-primary px-2"
        aria-live="polite"
      >
        {capitalizedLabel}
      </span>
      <button
        onClick={handleNextMonth}
        className="p-1.5 hover:bg-bg-elevated rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer"
        aria-label="Próximo mês"
        title="Próximo Mês"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
      <button
        onClick={handleToday}
        disabled={isCurrentMonth}
        className="px-2.5 py-1 text-xs bg-brand/10 hover:bg-brand/20 text-brand hover:text-brand-hover disabled:opacity-50 disabled:cursor-not-allowed font-medium rounded-lg transition-colors ml-1"
      >
        Hoje
      </button>
    </div>
  );
}
