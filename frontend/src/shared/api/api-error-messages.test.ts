import { describe, expect, it } from 'vitest';
import { apiErrorMessage } from './api-error-messages';

const API_CODES = [
  'DATABASE_UNAVAILABLE',
  'INTERNAL_ERROR',
  'NOT_FOUND',
  'INVALID_ID',
  'VALIDATION_ERROR',
  'INVALID_JSON',
  'PAYLOAD_TOO_LARGE',
  'UNAUTHENTICATED',
  'INVALID_TOKEN',
  'FORBIDDEN',
  'INVALID_CREDENTIALS',
  'USER_INACTIVE',
  'TOO_MANY_REQUESTS',
  'EMAIL_ALREADY_EXISTS',
  'USER_NOT_FOUND',
  'PRODUCT_NOT_FOUND',
  'CANNOT_MODIFY_SELF',
] as const;

const GENERIC = 'Ocurrió un error inesperado. Inténtalo de nuevo.';

describe('apiErrorMessage', () => {
  it.each(API_CODES)('gives %s its own Spanish message', (code) => {
    expect(apiErrorMessage(code)).not.toBe(GENERIC);
    expect(apiErrorMessage(code)).toMatch(/[.]$/);
  });

  it('names the concrete problem for the codes users meet most', () => {
    expect(apiErrorMessage('PRODUCT_NOT_FOUND')).toBe('El producto no existe.');
    expect(apiErrorMessage('USER_NOT_FOUND')).toBe('El usuario no existe.');
    expect(apiErrorMessage('EMAIL_ALREADY_EXISTS')).toBe('Ya existe un usuario con ese correo.');
    expect(apiErrorMessage('FORBIDDEN')).toBe('No tienes permiso para realizar esta acción.');
  });

  it('falls back to the generic Spanish message for unknown codes', () => {
    expect(apiErrorMessage('SOMETHING_NEW')).toBe(GENERIC);
    expect(apiErrorMessage('toString')).toBe(GENERIC);
  });
});
