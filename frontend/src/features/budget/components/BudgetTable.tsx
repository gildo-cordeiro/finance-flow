import { Link } from 'react-router-dom';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/utils/formatters';
import type { BudgetLine } from '../types';
import { PlannedAmountCell } from './PlannedAmountCell';

interface BudgetTableProps {
  lines: BudgetLine[];
  month: string;
}

const GRID = 'grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 md:grid-cols-[minmax(0,1fr)_8rem_7rem_7rem_19rem] md:items-center';

export function BudgetTable({ lines, month }: BudgetTableProps) {
  return (
    <div>
      <div className={cn(GRID, 'hidden border-b border-border-subtle px-4 py-3 text-xs font-semibold text-text-muted md:grid')}>
        <span>Categoria</span>
        <span className="text-right">Planejado</span>
        <span className="text-right">Realizado</span>
        <span className="text-right">Saldo</span>
        <span>Progresso</span>
      </div>
      <ul aria-label="Categorias do orçamento">
        {lines.map((line) => (
          <li key={line.categoryId}>
            <Row line={line} month={month} />
            {line.children.length > 0 && (
              <ul aria-label={`Subcategorias de ${line.name}`}>
                {line.children.map((child) => (
                  <li key={child.categoryId}>
                    <Row line={child} month={month} sub />
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Row({ line, month, sub = false }: { line: BudgetLine; month: string; sub?: boolean }) {
  const expense = line.type === 'EXPENSE';
  return (
    <div className={cn(GRID, 'border-b border-border-subtle px-4 py-3', sub && 'bg-bg-base/40 pl-8 text-sm md:pl-12')}>
      <div className="min-w-0">
        <Link
          to={`/transacoes?mes=${month}&categoria=${line.categoryId}`}
          className={cn('truncate font-medium hover:text-brand', sub ? 'text-text-label' : 'text-text-primary')}
        >
          {line.name}
        </Link>
        {line.archived && <span className="ml-2 text-xs text-text-muted">arquivada</span>}
        <p className="text-xs text-text-muted md:hidden">
          Realizado {formatCurrency(line.realized)}
          {line.remaining !== null && <> · saldo {formatCurrency(line.remaining)}</>}
        </p>
      </div>
      <div className="text-right">
        <PlannedAmountCell line={line} month={month} />
      </div>
      <span className="hidden text-right text-sm tabular-nums md:block" aria-label={`Realizado de ${line.name}`}>
        {formatCurrency(line.realized)}
      </span>
      <span className="hidden text-right text-sm md:block">
        {line.remaining === null ? (
          <span className="text-text-muted">—</span>
        ) : (
          <span
            aria-label={`Saldo de ${line.name}`}
            className={cn('tabular-nums', expense && line.remaining < 0 ? 'text-danger' : 'text-text-label')}
          >
            {formatCurrency(line.remaining)}
          </span>
        )}
      </span>
      <ProgressBar value={line.realized} max={line.planned} className="col-span-2 md:col-span-1" />
    </div>
  );
}
