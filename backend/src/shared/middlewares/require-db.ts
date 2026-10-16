import type { RequestHandler } from 'express';
import { isDatabaseConnected } from '../db/connection.js';
import { AppError } from '../errors/app-error.js';

/**
 * Guards routes that need MongoDB. The server keeps running while the database is
 * down (the connection retries in the background), so instead of letting Mongoose
 * buffer or time out, these routes fail fast with 503 `DATABASE_UNAVAILABLE`.
 *
 * Mount it on every module router that queries the database.
 */
export const requireDb: RequestHandler = (_req, _res, next) => {
  if (!isDatabaseConnected()) {
    next(
      new AppError(
        503,
        'DATABASE_UNAVAILABLE',
        'The database is temporarily unavailable, please retry later',
      ),
    );
    return;
  }
  next();
};
