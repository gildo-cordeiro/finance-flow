import type { FormEvent } from 'react';
import { Search } from 'lucide-react';
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

  const onSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get('q');
    onChange({ q: typeof value === 'string' ? value : '' });
  };

  return (
    <Card className="mb-4 space-y-4 border-border-subtle p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <PeriodSelector value={filters.month} onChange={(month) => onChange({ month })} />
        <div className="flex items-center gap-2">
          <span id="date-field-label" className="text-[13px] font-semibold text-text-label">
            Data por
          </span>
          <div role="group" aria-labelledby="date-field-label" className="inline-flex rounded-lg border border-border-subtle bg-bg-base p-0.5">
            {(Object.keys(DATE_FIELD_LABELS) as DateField[]).map((field) => (
              <button
                key={field}
                type="button"
                aria-pressed={filters.dateField === field}
                onClick={() => onChange({ dateField: field })}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium text-text-label transition-colors',
                  filters.dateField === field && 'bg-bg-elevated font-semibold text-text-primary'
                )}
              >
                {DATE_FIELD_LABELS[field]}
              </button>
            ))}
          </div>
        </div>
        <form role="search" onSubmit={onSearch} className="relative flex-1" key={filters.q}>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            name="q"
            type="search"
            aria-label="Buscar pela descrição"
            placeholder="Buscar pela descrição"
            defaultValue={filters.q}
            className="pl-9"
          />
        </form>
      </div>
      <div className="flex flex-wrap items-center gap-2">
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
        <select
          aria-label="Conta"
          className={cn(nativeSelectClass, 'h-9 w-auto min-w-40')}
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
          className={cn(nativeSelectClass, 'h-9 w-auto min-w-44')}
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
          className={cn(nativeSelectClass, 'h-9 w-auto min-w-36')}
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
        {canClear && (
          <Button type="button" variant="ghost" size="sm" onClick={onClear}>
            Limpar filtros
          </Button>
        )}
      </div>
    </Card>
  );
}
