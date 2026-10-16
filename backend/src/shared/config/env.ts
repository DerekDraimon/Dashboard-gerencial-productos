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

const JWT_EXPIRES_IN_PATTERN = /^[1-9]\d*[smhd]?$/;

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce
    .number({ error: 'PORT must be a number' })
    .int('PORT must be an integer')
    .min(1, 'PORT must be between 1 and 65535')
    .max(65535, 'PORT must be between 1 and 65535')
    .default(4000),
  MONGODB_URI: requiredString('MONGODB_URI'),
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
  ...loginRateLimitEnvSchema.shape,
});

export type Env = z.infer<typeof envSchema>;

type EnvSource = Record<string, string | undefined>;

export function parseEnv(source: EnvSource): Env {
  const result = envSchema.safeParse(source);
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
