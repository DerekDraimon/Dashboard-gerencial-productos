import { describe, expect, it } from 'vitest';
import { roleLabel } from './role-label';

describe('roleLabel', () => {
  it('shows the API roles with their Spanish labels', () => {
    expect(roleLabel('ADMIN')).toBe('Administrador');
    expect(roleLabel('USER')).toBe('Usuario');
  });
});
