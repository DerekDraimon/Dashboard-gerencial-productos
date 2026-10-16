import type { RequestHandler } from 'express';
import { AppError } from '../errors/app-error.js';

/** Fallback for unmatched routes: forwards a 404 `NOT_FOUND` to the error handler. */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`));
};
