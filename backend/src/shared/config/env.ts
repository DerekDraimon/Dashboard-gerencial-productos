import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

const requiredString = (name: string) =>
  z
    .string({ error: `${name} is required` })
    .trim()
    .min(1, `${name} is required`);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce
    .number({ error: 'PORT must be a number' })
    .int('PORT must be an integer')
    .min(1, 'PORT must be between 1 and 65535')
    .max(65535, 'PORT must be between 1 and 65535')
    .default(4000),
  MONGODB_URI: requiredString('MONGODB_URI'),
  JWT_SECRET: requiredString('JWT_SECRET'),
  JWT_EXPIRES_IN: z.string().trim().min(1).default('1d'),
  CORS_ORIGIN: z.string().trim().min(1).default('http://localhost:5173'),
  SEED_ADMIN_PASSWORD: z.string().min(1).optional(),
  SEED_USER_PASSWORD: z.string().min(1).optional(),
});

/** Validated, typed application configuration. */
export type Env = z.infer<typeof envSchema>;

type EnvSource = Record<string, string | undefined>;

/**
 * Validates a raw variable map (usually `process.env`) and returns the typed config.
 * Pure function so it can be unit tested without touching the real environment.
 *
 * @throws Error listing every invalid or missing variable by name, so the process can fail fast.
 */
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

/** Loads `.env` (when present) into `process.env` and validates the result. */
export function loadEnv(): Env {
  loadDotenv({ quiet: true });
  return parseEnv(process.env);
}
