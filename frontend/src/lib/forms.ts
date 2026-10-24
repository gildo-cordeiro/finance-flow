import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError } from '@/services/errors';

/**
 * Marca no formulário os campos que a API recusou (`errors` do Problem Details).
 * `fields` liga o nome do campo na API ao nome no formulário. Devolve se algum campo foi marcado.
 */
export function applyFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: Partial<Record<string, Path<T>>>
): boolean {
  if (!(error instanceof ApiError)) return false;
  let applied = false;
  for (const { field, message } of error.fieldErrors) {
    const name = fields[field];
    if (name) {
      setError(name, { message });
      applied = true;
    }
  }
  return applied;
}
