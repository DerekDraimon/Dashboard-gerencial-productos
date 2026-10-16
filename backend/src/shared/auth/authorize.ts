import type { RequestHandler } from 'express';
import { AppError } from '../errors/app-error.js';

export function unauthenticatedError(): AppError {
  return new AppError(401, 'UNAUTHENTICATED', 'Authentication is required');
}

export function authorize(...roles: string[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) {
      next(unauthenticatedError());
      return;
    }
    if (!roles.includes(req.auth.role)) {
      next(new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action'));
      return;
    }
    next();
  };
}
