import { useSearchParams } from 'react-router-dom';
import { currentCompetenceMonth } from '@/utils/formatters';

/** Mês na URL (`?mes=2026-10`), como na lista de transações. */
export function useBudgetMonth() {
  const [params, setParams] = useSearchParams();
  const value = params.get('mes');
  const month = value && /^\d{4}-\d{2}$/.test(value) ? value : currentCompetenceMonth();
  const setMonth = (next: string) => setParams({ mes: next }, { replace: true });
  return { month, setMonth };
}
