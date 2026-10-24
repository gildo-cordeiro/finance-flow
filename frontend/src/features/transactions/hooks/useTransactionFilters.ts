import { useSearchParams } from 'react-router-dom';
import { currentCompetenceMonth } from '@/utils/formatters';
import type { DateField, TransactionFilters, TransactionStatus, TransactionType } from '../types';

// Filtros na URL, para o Painel e o Orçamento poderem abrir a lista já filtrada
const DATE_FIELDS: Record<string, DateField> = { competencia: 'COMPETENCE', vencimento: 'DUE', pagamento: 'PAYMENT' };
const TYPES: Record<string, TransactionType> = { receita: 'INCOME', despesa: 'EXPENSE', transferencia: 'TRANSFER' };
const STATUSES: Record<string, TransactionStatus> = {
  planejado: 'PLANNED',
  pendente: 'PENDING',
  pago: 'PAID',
  atrasado: 'OVERDUE',
};

const keyOf = <T extends string>(map: Record<string, T>, value: T | null) =>
  Object.keys(map).find((key) => map[key] === value);

export function useTransactionFilters() {
  const [params, setParams] = useSearchParams();
  const month = params.get('mes');

  const filters: TransactionFilters = {
    month: month && /^\d{4}-\d{2}$/.test(month) ? month : currentCompetenceMonth(),
    dateField: DATE_FIELDS[params.get('data') ?? ''] ?? 'COMPETENCE',
    type: TYPES[params.get('tipo') ?? ''] ?? null,
    accountId: params.get('conta'),
    categoryId: params.get('categoria'),
    status: STATUSES[params.get('status') ?? ''] ?? null,
    q: params.get('q') ?? '',
  };

  const setFilters = (changes: Partial<TransactionFilters>) => {
    const next = { ...filters, ...changes };
    const entries: [string, string | null | undefined][] = [
      ['mes', next.month],
      ['data', next.dateField === 'COMPETENCE' ? null : keyOf(DATE_FIELDS, next.dateField)],
      ['tipo', keyOf(TYPES, next.type)],
      ['conta', next.accountId],
      ['categoria', next.categoryId],
      ['status', keyOf(STATUSES, next.status)],
      ['q', next.q || null],
    ];
    const search = new URLSearchParams();
    for (const [key, value] of entries) if (value) search.set(key, value);
    setParams(search, { replace: true });
  };

  const hasExtraFilters = Boolean(
    filters.type || filters.accountId || filters.categoryId || filters.status || filters.q
  );

  return { filters, setFilters, hasExtraFilters };
}
