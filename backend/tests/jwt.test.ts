import jwt from 'jsonwebtoken';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { signToken } from '../src/shared/auth/jwt.js';

function lifetimeSeconds(token: string): number {
  const decoded = jwt.decode(token);
  if (decoded === null || typeof decoded === 'string') {
    throw new Error('Token payload is not an object');
  }
  const { exp, iat } = decoded;
  if (exp === undefined || iat === undefined) {
    throw new Error('Token is missing exp or iat');
  }
  return exp - iat;
}

describe('signToken expiry', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    ['3600', 3600],
    ['15m', 900],
    ['12h', 43200],
    ['1d', 86400],
  ])('JWT_EXPIRES_IN=%s gives a token lifetime of %i seconds', (value, expected) => {
    vi.stubEnv('JWT_SECRET', 'test-secret');
    vi.stubEnv('JWT_EXPIRES_IN', value);

    const token = signToken({ sub: 'user-1', role: 'user' });

    expect(lifetimeSeconds(token)).toBe(expected);
  });
});
