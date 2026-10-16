import type { Application, RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import { loginRateLimitEnvSchema } from '../../shared/config/env.js';
import { AppError } from '../../shared/errors/app-error.js';

function createLoginRateLimiter(): RequestHandler {
  const { LOGIN_RATE_LIMIT_WINDOW_MS, LOGIN_RATE_LIMIT_MAX } = loginRateLimitEnvSchema.parse(
    process.env,
  );
  return rateLimit({
    windowMs: LOGIN_RATE_LIMIT_WINDOW_MS,
    limit: LOGIN_RATE_LIMIT_MAX,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    // Created lazily on the first login of each app (see below), which this check would flag.
    validate: { creationStack: false },
    handler: (_req, _res, next) => {
      next(
        new AppError(429, 'TOO_MANY_REQUESTS', 'Too many login attempts, please try again later'),
      );
    },
  });
}

const limitersByApp = new WeakMap<Application, RequestHandler>();

/**
 * `authRouter` is a module singleton shared by every `createApp()` call, so the limiter is keyed
 * by app: each app instance (one per test suite) gets its own counters instead of sharing them.
 * It is built on first use so the limits are read after `loadEnv()` has populated `process.env`.
 */
export const loginRateLimit: RequestHandler = (req, res, next) => {
  let limiter = limitersByApp.get(req.app);
  if (!limiter) {
    limiter = createLoginRateLimiter();
    limitersByApp.set(req.app, limiter);
  }
  return limiter(req, res, next);
};
