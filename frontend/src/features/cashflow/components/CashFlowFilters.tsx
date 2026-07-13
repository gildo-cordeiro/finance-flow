import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface CashFlowFiltersProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onCurrentMonth: () => void;
  displayMonthYear: string;
}

export function CashFlowFilters({
  selectedMonth,
  onMonthChange,
  onPrevMonth,
  onNextMonth,
  onCurrentMonth,
  displayMonthYear,
}: CashFlowFiltersProps) {
  return (
    <div className="flex items-center gap-2 bg-bg-surface border border-border-subtle p-1.5 rounded-xl shadow-lg">
      <button
        onClick={onPrevMonth}
        className="p-1.5 text-text-secondary hover:text-text-primary rounded-lg hover:bg-bg-elevated transition-colors cursor-pointer"
        title="Mês Anterior"
      >
        <ChevronLeft className="w-5.5 h-5.5" />
      </button>

      <button
        onClick={onCurrentMonth}
        className="px-2.5 py-1.5 text-xs font-semibold bg-bg-elevated hover:bg-bg-base border border-border-subtle rounded-lg text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
      >
        Mês Atual
      </button>

      <div className="relative flex items-center gap-2 px-3.5 py-1.5 bg-bg-base border border-border-subtle rounded-lg text-sm font-semibold text-text-primary hover:border-brand/45 transition-colors cursor-pointer group">
        <Calendar className="w-4 h-4 text-brand group-hover:scale-105 transition-transform" />
        <span className="capitalize">{displayMonthYear}</span>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => {
            if (e.target.value) onMonthChange(e.target.value);
          }}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
      </div>

      <button
        onClick={onNextMonth}
        className="p-1.5 text-text-secondary hover:text-text-primary rounded-lg hover:bg-bg-elevated transition-colors cursor-pointer"
        title="Próximo Mês"
      >
        <ChevronRight className="w-5.5 h-5.5" />
      </button>
    </div>
  );
}
