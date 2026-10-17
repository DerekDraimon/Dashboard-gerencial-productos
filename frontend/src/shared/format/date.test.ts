import { describe, expect, it } from 'vitest';
import { formatDate } from './date';

describe('formatDate', () => {
  it('formats an ISO date as DD/MM/AAAA in UTC', () => {
    expect(formatDate('2025-03-07T15:30:00.000Z')).toBe('07/03/2025');
    expect(formatDate('2024-12-31T23:59:59.000Z')).toBe('31/12/2024');
    expect(formatDate('2025-01-01T00:00:00.000Z')).toBe('01/01/2025');
  });

  it('shows a dash for invalid or empty values', () => {
    expect(formatDate('no es una fecha')).toBe('—');
    expect(formatDate('')).toBe('—');
  });
});
