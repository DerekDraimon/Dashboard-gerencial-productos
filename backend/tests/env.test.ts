import { describe, expect, it } from 'vitest';
import { parseEnv } from '../src/shared/config/env.js';

const validSource = {
  MONGODB_URI: 'mongodb://localhost:27017/dashboard',
  JWT_SECRET: 'test-secret',
};

describe('parseEnv', () => {
  it('applies defaults when only the required variables are present', () => {
    const env = parseEnv(validSource);

    expect(env).toEqual({
      NODE_ENV: 'development',
      PORT: 4000,
      MONGODB_URI: 'mongodb://localhost:27017/dashboard',
      JWT_SECRET: 'test-secret',
      JWT_EXPIRES_IN: '1d',
      CORS_ORIGIN: 'http://localhost:5173',
    });
  });

  it('keeps optional seed passwords when provided', () => {
    const env = parseEnv({
      ...validSource,
      SEED_ADMIN_PASSWORD: 'Admin123!',
      SEED_USER_PASSWORD: 'User1234!',
    });

    expect(env.SEED_ADMIN_PASSWORD).toBe('Admin123!');
    expect(env.SEED_USER_PASSWORD).toBe('User1234!');
  });

  it('coerces PORT to a number', () => {
    expect(parseEnv({ ...validSource, PORT: '5000' }).PORT).toBe(5000);
  });

  it('throws an error naming MONGODB_URI when it is missing', () => {
    expect(() => parseEnv({ JWT_SECRET: 'test-secret' })).toThrow(/MONGODB_URI/);
  });

  it('treats an empty MONGODB_URI as missing', () => {
    expect(() => parseEnv({ ...validSource, MONGODB_URI: '' })).toThrow(/MONGODB_URI/);
  });

  it('throws an error naming JWT_SECRET when it is missing', () => {
    expect(() => parseEnv({ MONGODB_URI: validSource.MONGODB_URI })).toThrow(/JWT_SECRET/);
  });

  it('names every invalid variable in a single error', () => {
    expect(() => parseEnv({})).toThrow(/MONGODB_URI[\s\S]*JWT_SECRET|JWT_SECRET[\s\S]*MONGODB_URI/);
  });

  it('rejects a non-numeric PORT', () => {
    expect(() => parseEnv({ ...validSource, PORT: 'abc' })).toThrow(/PORT/);
  });

  it('rejects a PORT outside the valid range', () => {
    expect(() => parseEnv({ ...validSource, PORT: '70000' })).toThrow(/PORT/);
  });
});
