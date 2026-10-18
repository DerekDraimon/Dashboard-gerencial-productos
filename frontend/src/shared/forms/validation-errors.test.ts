import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/api-error';
import { applyValidationErrors } from './validation-errors';

interface Values {
  name: string;
  tags: string[];
}

const FIELDS = ['name', 'tags'] as const;

const SUMMARY = 'Algunos datos no son válidos. Revisa el formulario.';
const FIELD_MESSAGE = 'Revisa este campo.';

function validationError(details: unknown) {
  return new ApiError(400, 'VALIDATION_ERROR', SUMMARY, details);
}

describe('applyValidationErrors', () => {
  it('marks matched fields in Spanish and summarizes the leftovers once, never in English', () => {
    const setError = vi.fn();
    const error = validationError([
      { path: 'name', message: 'name is required' },
      { path: 'tags.1', message: 'tag is invalid' },
      { path: 'extra', message: 'extra is not allowed' },
      { path: 'other', message: 'other is not allowed' },
    ]);

    expect(applyValidationErrors<Values>(error, FIELDS, setError)).toEqual([SUMMARY]);
    expect(setError).toHaveBeenCalledWith('name', { message: FIELD_MESSAGE });
    expect(setError).toHaveBeenCalledWith('tags', { message: FIELD_MESSAGE });
    expect(setError).toHaveBeenCalledTimes(2);
  });

  it('returns an empty list when every detail found its field', () => {
    const error = validationError([{ path: 'name', message: 'Nombre inválido.' }]);

    expect(applyValidationErrors<Values>(error, FIELDS, vi.fn())).toEqual([]);
  });

  it('returns null when the error has no usable details', () => {
    const setError = vi.fn();
    const conflict = new ApiError(409, 'EMAIL_ALREADY_EXISTS', 'Duplicado.', [
      { path: 'name', message: 'x' },
    ]);

    expect(applyValidationErrors<Values>(validationError(undefined), FIELDS, setError)).toBeNull();
    expect(applyValidationErrors<Values>(validationError([]), FIELDS, setError)).toBeNull();
    expect(applyValidationErrors<Values>(conflict, FIELDS, setError)).toBeNull();
    expect(applyValidationErrors<Values>(new Error('boom'), FIELDS, setError)).toBeNull();
    expect(setError).not.toHaveBeenCalled();
  });

  it('ignores malformed entries', () => {
    const setError = vi.fn();
    const error = validationError([
      null,
      'name',
      { path: 'name' },
      { path: 1, message: 'x' },
      { path: 'extra', message: 'extra is not allowed' },
    ]);

    expect(applyValidationErrors<Values>(error, FIELDS, setError)).toEqual([SUMMARY]);
    expect(setError).not.toHaveBeenCalled();
  });
});
