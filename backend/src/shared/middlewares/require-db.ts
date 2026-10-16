import type { RequestHandler } from 'express';
import { isDatabaseConnected } from '../db/connection.js';
import { AppError } from '../errors/app-error.js';

/** Fails fast with 503 while Mongo is down instead of letting Mongoose buffer queries until they time out. */
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
