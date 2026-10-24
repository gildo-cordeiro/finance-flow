import { useId } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCompetenceSuggestion } from '../hooks/useTransactions';

function monthLabel(month: string) {
  const label = format(parseISO(`${month}-01`), "MMMM 'de' yyyy", { locale: ptBR });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

interface CompetenceFieldProps {
  accountId: string;
  referenceDate: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

/** Mostra a competência sugerida pelo backend (ADR-0008); o usuário pode trocar por outro mês. */
export function CompetenceField({ accountId, referenceDate, value, onChange, error }: CompetenceFieldProps) {
  const inputId = useId();
  const suggestion = useCompetenceSuggestion(accountId, referenceDate);
  const suggested = suggestion.data?.competenceMonth;
  const informed = value !== '';

  return (
    <div className="space-y-2 rounded-lg border border-brand/35 bg-brand/5 p-4">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={inputId} className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          Competência
          {!informed && suggested && (
            <span className="rounded-full bg-brand/15 px-2 text-xs font-semibold text-brand">Sugerida</span>
          )}
        </label>
        {informed && suggested && suggested !== value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')}>
            Usar a sugerida ({monthLabel(suggested)})
          </Button>
        )}
      </div>
      <Input
        id={inputId}
        type="month"
        value={informed ? value : (suggested ?? '')}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
      />
      <p className="text-xs text-text-label">
        {accountId
          ? 'Calculada pela data e pelo deslocamento da conta. O orçamento usa este mês.'
          : 'Escolha a conta para ver a competência sugerida.'}
      </p>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
