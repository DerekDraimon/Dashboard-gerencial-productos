import { isIP } from 'node:net';
import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

const requiredString = (name: string) =>
  z
    .string({ error: `${name} is required` })
    .trim()
    .min(1, `${name} is required`);

const positiveInteger = (name: string, defaultValue: number) =>
  z.coerce
    .number({ error: `${name} must be a number` })
    .int(`${name} must be an integer`)
    .positive(`${name} must be greater than 0`)
    .default(defaultValue);

/** Exported so the login limiter can read the same limits from `process.env` without the other required variables. */
export const loginRateLimitEnvSchema = z.object({
  LOGIN_RATE_LIMIT_WINDOW_MS: positiveInteger('LOGIN_RATE_LIMIT_WINDOW_MS', 900_000),
  LOGIN_RATE_LIMIT_MAX: positiveInteger('LOGIN_RATE_LIMIT_MAX', 10),
});

/** The values Express accepts for `app.set('trust proxy', value)`, minus the function form. */
export type TrustProxy = boolean | number | string[];

const TRUST_PROXY_NAMES = new Set(['loopback', 'linklocal', 'uniquelocal']);

function isTrustedAddress(entry: string): boolean {
  if (TRUST_PROXY_NAMES.has(entry)) {
    return true;
  }
  const [address = '', prefix, ...rest] = entry.split('/');
  const version = isIP(address);
  if (version === 0 || rest.length > 0) {
    return false;
  }
  if (prefix === undefined) {
    return true;
  }
  const maxPrefix = version === 4 ? 32 : 128;
  return /^\d+$/.test(prefix) && Number(prefix) <= maxPrefix;
}

const trustProxySchema = z
  .string()
  .trim()
  .transform((value, ctx): TrustProxy => {
    if (value === 'true' || value === 'false') {
      return value === 'true';
    }
    if (/^\d+$/.test(value)) {
      return Number(value);
    }
    const entries = value.split(',').map((entry) => entry.trim());
    if (!entries.every(isTrustedAddress)) {
      ctx.addIssue({
        code: 'custom',
        message:
          'TRUST_PROXY must be true, false, a hop count or a comma-separated list of IP addresses/subnets (e.g. 1, loopback, 10.0.0.0/8)',
      });
      return z.NEVER;
    }
    return entries;
  });

const JWT_EXPIRES_IN_PATTERN = /^[1-9]\d*[smhd]?$/;

/** Empty or blank values count as not set, as `KEY=` in a .env file usually means "nothing here". */
const optionalSecret = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().optional(),
);

const MONGODB_SCHEME = /^(mongodb(?:\+srv)?:\/\/)(.*)$/;
const CREDENTIALS_ERROR = 'MONGODB_USER and MONGODB_PASSWORD must be set together';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce
    .number({ error: 'PORT must be a number' })
    .int('PORT must be an integer')
    .min(1, 'PORT must be between 1 and 65535')
    .max(65535, 'PORT must be between 1 and 65535')
    .default(4000),
  MONGODB_URI: requiredString('MONGODB_URI'),
  MONGODB_USER: optionalSecret,
  MONGODB_PASSWORD: optionalSecret,
  JWT_SECRET: requiredString('JWT_SECRET').min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z
    .string()
    .trim()
    .regex(
      JWT_EXPIRES_IN_PATTERN,
      'JWT_EXPIRES_IN must be a positive number of seconds or a number followed by s, m, h or d (e.g. 3600, 15m, 12h, 1d)',
    )
    .default('1d'),
  CORS_ORIGIN: z.string().trim().min(1).default('http://localhost:5173'),
  SEED_ADMIN_PASSWORD: z.string().min(1).optional(),
  SEED_USER_PASSWORD: z.string().min(1).optional(),
  // `TRUST_PROXY=` left empty in a .env file means not set, not an invalid value.
  TRUST_PROXY: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    trustProxySchema.optional(),
  ),
  ...loginRateLimitEnvSchema.shape,
});

/**
 * Hosts like Render keep the database user and password apart from the URI. They are percent-encoded
 * into it here, so a password with `@`, `:` or `/` cannot break the connection string.
 * Error messages never include the values themselves.
 */
const envWithDatabaseCredentials = envSchema
  .superRefine(({ MONGODB_URI, MONGODB_USER, MONGODB_PASSWORD }, ctx) => {
    if (MONGODB_USER === undefined && MONGODB_PASSWORD === undefined) return;
    if (MONGODB_USER === undefined || MONGODB_PASSWORD === undefined) {
      const missing = MONGODB_USER === undefined ? 'MONGODB_USER' : 'MONGODB_PASSWORD';
      ctx.addIssue({ code: 'custom', path: [missing], message: CREDENTIALS_ERROR });
      return;
    }
    const match = MONGODB_SCHEME.exec(MONGODB_URI);
    if (!match) {
      ctx.addIssue({
        code: 'custom',
        path: ['MONGODB_URI'],
        message:
          'must start with mongodb:// or mongodb+srv:// to add MONGODB_USER and MONGODB_PASSWORD',
      });
      return;
    }
    const [authority = ''] = (match[2] ?? '').split(/[/?]/, 1);
    if (authority.includes('@')) {
      ctx.addIssue({
        code: 'custom',
        path: ['MONGODB_URI'],
        message:
          'already includes credentials (user:password@); remove them, or the <db_username>:<db_password> placeholders, when MONGODB_USER and MONGODB_PASSWORD are set',
      });
    }
  })
  .transform(({ MONGODB_USER, MONGODB_PASSWORD, ...env }) => {
    if (MONGODB_USER === undefined || MONGODB_PASSWORD === undefined) return env;
    const credentials = `${encodeURIComponent(MONGODB_USER)}:${encodeURIComponent(MONGODB_PASSWORD)}@`;
    return {
      ...env,
      MONGODB_URI: env.MONGODB_URI.replace(
        MONGODB_SCHEME,
        (_, scheme: string, rest: string) => `${scheme}${credentials}${rest}`,
      ),
    };
  });

export type Env = z.infer<typeof envWithDatabaseCredentials>;

type EnvSource = Record<string, string | undefined>;

export function parseEnv(source: EnvSource): Env {
  const result = envWithDatabaseCredentials.safeParse(source);
  if (result.success) {
    return result.data;
  }

  const problems = result.error.issues.map((issue) => {
    const name = issue.path.join('.') || 'environment';
    return `  - ${name}: ${issue.message}`;
  });
  throw new Error(`Invalid environment configuration:\n${problems.join('\n')}`);
}

export function loadEnv(): Env {
  loadDotenv({ quiet: true });
  return parseEnv(process.env);
}
