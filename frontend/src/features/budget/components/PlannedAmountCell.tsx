import { useState, type KeyboardEvent } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/services/errors';
import { formatCurrency, maskCurrency } from '@/utils/formatters';
import { useSetPlanned } from '../hooks/useBudget';
import type { BudgetLine } from '../types';

interface PlannedAmountCellProps {
  line: BudgetLine;
  month: string;
}

/** Planejado editável na própria linha: Enter ou sair do campo salva, Esc cancela. */
export function PlannedAmountCell({ line, month }: PlannedAmountCellProps) {
  const setPlanned = useSetPlanned(month);
  const [cents, setCents] = useState<number | null>(null);
  const label = `Planejado de ${line.name}`;
  const fromChildren = line.children.length > 0 && line.planned !== null && line.planned !== line.directPlanned;

  if (line.archived) {
    return <span className="text-sm text-text-muted">{line.planned === null ? '—' : formatCurrency(line.planned)}</span>;
  }

  const save = () => {
    if (cents === null) return;
    const amount = cents / 100;
    setCents(null);
    if (amount === (line.directPlanned ?? 0)) return;
    setPlanned.mutate(
      { categoryId: line.categoryId, amount },
      { onError: (error) => toast.error(errorMessage(error)) }
    );
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') save();
    if (event.key === 'Escape') setCents(null);
  };

  if (cents !== null) {
    return (
      <div className="flex flex-col items-end gap-1">
        <input
          autoFocus
          aria-label={label}
          inputMode="numeric"
          value={maskCurrency(cents)}
          onChange={(event) => setCents(Number(event.target.value.replace(/\D/g, '').slice(0, 12) || 0))}
          onKeyDown={onKeyDown}
          onBlur={save}
          className="h-8 w-32 rounded-md border border-brand bg-bg-base px-2 text-right text-sm tabular-nums text-text-primary outline-none"
        />
        {line.children.length > 0 && (
          <span className="text-xs text-text-muted">Valor direto; as subcategorias somam à parte</span>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      title={fromChildren ? 'Inclui o planejado das subcategorias' : undefined}
      disabled={setPlanned.isPending}
      onClick={() => setCents(Math.round((line.directPlanned ?? 0) * 100))}
      className={cn(
        'inline-flex h-8 min-w-28 items-center justify-end rounded-md border border-transparent px-2 text-sm tabular-nums',
        'hover:border-border-subtle focus-visible:border-brand focus-visible:outline-none',
        line.planned === null ? 'text-brand' : 'text-text-primary'
      )}
    >
      {line.planned === null ? 'Definir' : formatCurrency(line.planned)}
    </button>
  );
}
