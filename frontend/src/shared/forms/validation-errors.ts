import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form';
import { ApiError } from '../api/api-error';

interface ValidationDetail {
  path: string;
  message: string;
}

function isValidationDetail(detail: unknown): detail is ValidationDetail {
  if (typeof detail !== 'object' || detail === null) return false;
  const { path, message } = detail as Record<string, unknown>;
  return typeof path === 'string' && typeof message === 'string';
}

/**
 * Puts each `400 VALIDATION_ERROR` detail on its form field. Returns the messages no field
 * could show, or null when the error carries no details (the caller reports it as a whole).
 */
export function applyValidationErrors<Values extends FieldValues>(
  error: unknown,
  fields: readonly FieldPath<Values>[],
  setError: UseFormSetError<Values>,
): string[] | null {
  if (!(error instanceof ApiError) || error.code !== 'VALIDATION_ERROR') return null;
  const details = Array.isArray(error.details) ? error.details.filter(isValidationDetail) : [];
  if (details.length === 0) return null;

  const unmatched: string[] = [];
  for (const { path, message } of details) {
    const name = fields.find((field) => field === path.split('.')[0]);
    if (name) setError(name, { message });
    else unmatched.push(message);
  }
  return unmatched;
}
