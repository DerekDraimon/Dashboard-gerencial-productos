import { describe, expect, it } from 'vitest';
import { parseEnv } from '../src/shared/config/env.js';

const secret32 = 'a'.repeat(32);

const validSource = {
  MONGODB_URI: 'mongodb://localhost:27017/dashboard',
  JWT_SECRET: secret32,
};

describe('parseEnv', () => {
  it('applies defaults when only the required variables are present', () => {
    const env = parseEnv(validSource);

    expect(env).toEqual({
      NODE_ENV: 'development',
      PORT: 4000,
      MONGODB_URI: 'mongodb://localhost:27017/dashboard',
      JWT_SECRET: secret32,
      JWT_EXPIRES_IN: '1d',
      CORS_ORIGIN: 'http://localhost:5173',
      LOGIN_RATE_LIMIT_WINDOW_MS: 900000,
      LOGIN_RATE_LIMIT_MAX: 10,
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
    expect(() => parseEnv({ JWT_SECRET: secret32 })).toThrow(/MONGODB_URI/);
  });

  it('treats an empty MONGODB_URI as missing', () => {
    expect(() => parseEnv({ ...validSource, MONGODB_URI: '' })).toThrow(/MONGODB_URI/);
  });

  it('throws an error naming JWT_SECRET when it is missing', () => {
    expect(() => parseEnv({ MONGODB_URI: validSource.MONGODB_URI })).toThrow(/JWT_SECRET/);
  });

  it('accepts a JWT_SECRET of exactly 32 characters (boundary)', () => {
    expect(parseEnv(validSource).JWT_SECRET).toBe(secret32);
  });

  it('rejects a JWT_SECRET shorter than 32 characters', () => {
    expect(() => parseEnv({ ...validSource, JWT_SECRET: 'a'.repeat(31) })).toThrow(
      /JWT_SECRET must be at least 32 characters/,
    );
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

  it('coerces the login rate limit variables to numbers', () => {
    const env = parseEnv({
      ...validSource,
      LOGIN_RATE_LIMIT_WINDOW_MS: '60000',
      LOGIN_RATE_LIMIT_MAX: '1',
    });

    expect(env.LOGIN_RATE_LIMIT_WINDOW_MS).toBe(60000);
    expect(env.LOGIN_RATE_LIMIT_MAX).toBe(1);
  });

  it.each([
    ['LOGIN_RATE_LIMIT_MAX', 'abc'],
    ['LOGIN_RATE_LIMIT_MAX', '0'],
    ['LOGIN_RATE_LIMIT_MAX', '2.5'],
    ['LOGIN_RATE_LIMIT_WINDOW_MS', 'abc'],
    ['LOGIN_RATE_LIMIT_WINDOW_MS', '0'],
  ])('rejects %s=%s', (name, value) => {
    expect(() => parseEnv({ ...validSource, [name]: value })).toThrow(new RegExp(name));
  });

  it.each(['3600', '15m', '12h', '1d', '30s'])('accepts JWT_EXPIRES_IN=%s', (value) => {
    expect(parseEnv({ ...validSource, JWT_EXPIRES_IN: value }).JWT_EXPIRES_IN).toBe(value);
  });

  it.each(['1w', 'abc', '0', '-5', '0m', '1.5h', '15 m'])('rejects JWT_EXPIRES_IN=%s', (value) => {
    expect(() => parseEnv({ ...validSource, JWT_EXPIRES_IN: value })).toThrow(/JWT_EXPIRES_IN/);
  });

  describe('MongoDB credentials', () => {
    const atlas = 'mongodb+srv://cluster0.example.mongodb.net/dashboard?retryWrites=true';

    it('inserts MONGODB_USER and MONGODB_PASSWORD into the URI, percent-encoded', () => {
      const env = parseEnv({
        ...validSource,
        MONGODB_URI: atlas,
        MONGODB_USER: 'app user',
        MONGODB_PASSWORD: 'p@ss:w/rd#1',
      });

      expect(env.MONGODB_URI).toBe(
        'mongodb+srv://app%20user:p%40ss%3Aw%2Frd%231@cluster0.example.mongodb.net/dashboard?retryWrites=true',
      );
      expect(env).not.toHaveProperty('MONGODB_USER');
      expect(env).not.toHaveProperty('MONGODB_PASSWORD');
    });

    it('encodes $ and & in the password too', () => {
      const env = parseEnv({ ...validSource, MONGODB_USER: 'app', MONGODB_PASSWORD: 'a$1b$&c' });

      expect(env.MONGODB_URI).toBe('mongodb://app:a%241b%24%26c@localhost:27017/dashboard');
    });

    it('works with a plain mongodb:// URI too', () => {
      const env = parseEnv({ ...validSource, MONGODB_USER: 'app', MONGODB_PASSWORD: 'secret' });

      expect(env.MONGODB_URI).toBe('mongodb://app:secret@localhost:27017/dashboard');
    });

    it.each([
      ['', ''],
      ['  ', '  '],
    ])('treats empty credentials (%j, %j) as not set', (user, password) => {
      const env = parseEnv({ ...validSource, MONGODB_USER: user, MONGODB_PASSWORD: password });

      expect(env.MONGODB_URI).toBe('mongodb://localhost:27017/dashboard');
    });

    it.each([
      [{ MONGODB_USER: 'app' }, /MONGODB_PASSWORD: .*set together/],
      [{ MONGODB_PASSWORD: 'secret' }, /MONGODB_USER: .*set together/],
    ])('rejects only one of the two credentials (%j)', (credentials, message) => {
      expect(() => parseEnv({ ...validSource, ...credentials })).toThrow(message);
    });

    it.each([
      'mongodb+srv://<db_username>:<db_password>@cluster0.example.mongodb.net/',
      'mongodb://other:pw@localhost:27017/dashboard',
    ])('rejects credentials in both the URI and the variables (%s)', (uri) => {
      expect(() =>
        parseEnv({ ...validSource, MONGODB_URI: uri, MONGODB_USER: 'app', MONGODB_PASSWORD: 'x' }),
      ).toThrow(/MONGODB_URI: .*already includes credentials/);
    });

    it('rejects credentials for a URI that is not mongodb:// or mongodb+srv://', () => {
      expect(() =>
        parseEnv({
          ...validSource,
          MONGODB_URI: 'localhost:27017/dashboard',
          MONGODB_USER: 'app',
          MONGODB_PASSWORD: 'x',
        }),
      ).toThrow(/MONGODB_URI: .*mongodb:\/\/ or mongodb\+srv:\/\//);
    });

    it('never echoes the password in a configuration error', () => {
      expect(() =>
        parseEnv({
          ...validSource,
          MONGODB_URI: 'nope',
          MONGODB_USER: 'app',
          MONGODB_PASSWORD: 'Sup3rSecret',
        }),
      ).toThrow(expect.objectContaining({ message: expect.not.stringContaining('Sup3rSecret') }));
    });
  });

  it('leaves TRUST_PROXY undefined when it is not set', () => {
    expect(parseEnv(validSource).TRUST_PROXY).toBeUndefined();
  });

  it.each(['', '   '])('treats an empty TRUST_PROXY=%j as not set', (value) => {
    expect(parseEnv({ ...validSource, TRUST_PROXY: value }).TRUST_PROXY).toBeUndefined();
  });

  it.each([
    ['true', true],
    ['false', false],
    ['1', 1],
    ['0', 0],
    ['loopback', ['loopback']],
    ['10.0.0.1', ['10.0.0.1']],
    ['10.0.0.0/8, 192.168.1.1, ::1', ['10.0.0.0/8', '192.168.1.1', '::1']],
    ['fe80::/10,uniquelocal', ['fe80::/10', 'uniquelocal']],
  ])('parses TRUST_PROXY=%s', (value, expected) => {
    expect(parseEnv({ ...validSource, TRUST_PROXY: value }).TRUST_PROXY).toEqual(expected);
  });

  it.each(['yes', '-1', '1.5', 'not-an-ip', '10.0.0.0/33', '10.0.0.1,'])(
    'rejects TRUST_PROXY=%s',
    (value) => {
      expect(() => parseEnv({ ...validSource, TRUST_PROXY: value })).toThrow(/TRUST_PROXY/);
    },
  );
});
