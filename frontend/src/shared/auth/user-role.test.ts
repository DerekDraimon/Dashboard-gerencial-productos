import { describe, expect, it } from 'vitest';
import { canAccess } from './user-role';

describe('canAccess', () => {
  it('lets every signed-in role in when no roles are required', () => {
    expect(canAccess('USER', undefined)).toBe(true);
    expect(canAccess('ADMIN', undefined)).toBe(true);
  });

  it('only lets the listed roles in', () => {
    expect(canAccess('ADMIN', ['ADMIN'])).toBe(true);
    expect(canAccess('USER', ['ADMIN'])).toBe(false);
  });

  it('rejects a missing role when roles are required', () => {
    expect(canAccess(undefined, ['ADMIN', 'USER'])).toBe(false);
  });
});
