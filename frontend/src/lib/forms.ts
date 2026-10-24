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

/** Classes do `<select>` nativo com a mesma aparência do `Input`. */
export const nativeSelectClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive md:text-sm';
