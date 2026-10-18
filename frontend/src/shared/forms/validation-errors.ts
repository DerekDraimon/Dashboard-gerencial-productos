import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form';
import { ApiError } from '../api/api-error';

const FIELD_MESSAGE = 'Revisa este campo.';

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
 * Marks the field of each `400 VALIDATION_ERROR` detail. The detail text is the server's English,
 * so fields get a fixed Spanish hint and details without a field collapse into the error's
 * (already Spanish) summary. Returns null when there are no details (the caller reports it).
 */
export function applyValidationErrors<Values extends FieldValues>(
  error: unknown,
  fields: readonly FieldPath<Values>[],
  setError: UseFormSetError<Values>,
): string[] | null {
  if (!(error instanceof ApiError) || error.code !== 'VALIDATION_ERROR') return null;
  const details = Array.isArray(error.details) ? error.details.filter(isValidationDetail) : [];
  if (details.length === 0) return null;

  let unmatched = false;
  for (const { path } of details) {
    const name = fields.find((field) => field === path.split('.')[0]);
    if (name) setError(name, { message: FIELD_MESSAGE });
    else unmatched = true;
  }
  return unmatched ? [error.message] : [];
}
