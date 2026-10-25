import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PeriodSelector } from '@/components/ui/PeriodSelector';
import { cn } from '@/lib/cn';
import { nativeSelectClass } from '@/lib/forms';
import { useAccountOptions, useCategoryOptions } from '../hooks/useTransactions';
import {
  DATE_FIELD_LABELS,
  STATUS_LABELS,
  type DateField,
  type TransactionFilters,
  type TransactionStatus,
  type TransactionType,
} from '../types';

const TYPE_CHIPS: { label: string; value: TransactionType | null }[] = [
  { label: 'Todas', value: null },
  { label: 'Receitas', value: 'INCOME' },
  { label: 'Despesas', value: 'EXPENSE' },
  { label: 'Transferências', value: 'TRANSFER' },
];

interface TransactionFiltersBarProps {
  filters: TransactionFilters;
  onChange: (changes: Partial<TransactionFilters>) => void;
  onClear: () => void;
  canClear: boolean;
}

export function TransactionFiltersBar({ filters, onChange, onClear, canClear }: TransactionFiltersBarProps) {
  const accounts = useAccountOptions();
  const expense = useCategoryOptions('EXPENSE');
  const income = useCategoryOptions('INCOME');
  const [expanded, setExpanded] = useState(false);
  const activeFilters = [filters.type, filters.accountId, filters.categoryId, filters.status, filters.q].filter(Boolean).length;

  const [search, setSearch] = useState(filters.q);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => setSearch(filters.q), [filters.q]);

  useEffect(() => {
    if (search === filters.q) return;
    const timer = setTimeout(() => onChangeRef.current({ q: search }), 300);
    return () => clearTimeout(timer);
  }, [search, filters.q]);

  const onSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onChange({ q: search });
  };

  return (
    <Card className="mb-4 space-y-3 border-border-subtle p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <PeriodSelector value={filters.month} onChange={(month) => onChange({ month })} className="w-full sm:w-fit" />
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
          <span id="date-field-label" className="text-[13px] font-semibold text-text-label">
            Data por
          </span>
          <div
            role="group"
            aria-labelledby="date-field-label"
            className="grid grid-cols-3 rounded-lg border border-border-subtle bg-bg-base p-0.5 sm:inline-grid"
          >
            {(Object.keys(DATE_FIELD_LABELS) as DateField[]).map((field) => (
              <button
                key={field}
                type="button"
                aria-pressed={filters.dateField === field}
                onClick={() => onChange({ dateField: field })}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium text-text-label transition-colors sm:py-1.5',
                  filters.dateField === field && 'bg-bg-elevated font-semibold text-text-primary'
                )}
              >
                {DATE_FIELD_LABELS[field]}
              </button>
            ))}
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="lg:hidden"
          aria-expanded={expanded}
          aria-controls="transaction-filters"
          onClick={() => setExpanded((value) => !value)}
        >
          <SlidersHorizontal />
          {expanded ? 'Esconder filtros' : 'Filtros'}
          {activeFilters > 0 && (
            <span className="rounded-full bg-brand px-1.5 text-xs font-semibold text-white">{activeFilters}</span>
          )}
        </Button>
        <form
          role="search"
          onSubmit={onSearch}
          className={cn('relative flex-1 lg:block lg:min-w-56', !expanded && 'hidden')}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            name="q"
            type="search"
            aria-label="Buscar pela descrição"
            placeholder="Buscar pela descrição"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </form>
      </div>
      <div id="transaction-filters" className={cn('flex-wrap items-center gap-2 lg:flex', expanded ? 'flex' : 'hidden')}>
        {TYPE_CHIPS.map(({ label, value }) => (
          <button
            key={label}
            type="button"
            aria-pressed={filters.type === value}
            onClick={() => onChange({ type: value })}
            className={cn(
              'rounded-full border border-border-subtle px-3 py-1 text-sm font-medium text-text-label transition-colors',
              filters.type === value && 'border-brand bg-brand/10 text-text-primary'
            )}
          >
            {label}
          </button>
        ))}
        <span aria-hidden className="mx-1 hidden h-6 w-px bg-border-subtle lg:block" />
        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 lg:flex lg:w-auto lg:flex-wrap">
          <select
            aria-label="Conta"
            className={cn(nativeSelectClass, 'h-9 py-0 lg:w-auto lg:min-w-40')}
            value={filters.accountId ?? ''}
            onChange={(e) => onChange({ accountId: e.target.value || null })}
          >
            <option value="">Todas as contas</option>
            {accounts.data?.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Categoria"
            className={cn(nativeSelectClass, 'h-9 py-0 lg:w-auto lg:min-w-44')}
            value={filters.categoryId ?? ''}
            onChange={(e) => onChange({ categoryId: e.target.value || null })}
          >
            <option value="">Todas as categorias</option>
            {[
              { label: 'Despesas', items: expense.data },
              { label: 'Receitas', items: income.data },
            ].map(({ label, items }) => (
              <optgroup key={label} label={label}>
                {items?.flatMap((category) => [
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>,
                  ...category.subcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {`${category.name} › ${sub.name}`}
                    </option>
                  )),
                ])}
              </optgroup>
            ))}
          </select>
          <select
            aria-label="Status"
            className={cn(nativeSelectClass, 'h-9 py-0 lg:w-auto lg:min-w-36')}
            value={filters.status ?? ''}
            onChange={(e) => onChange({ status: (e.target.value || null) as TransactionStatus | null })}
          >
            <option value="">Todos os status</option>
            {(Object.keys(STATUS_LABELS) as TransactionStatus[]).map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        {canClear && (
          <Button type="button" variant="ghost" size="sm" onClick={onClear}>
            Limpar filtros
          </Button>
        )}
      </div>
    </Card>
  );
}
