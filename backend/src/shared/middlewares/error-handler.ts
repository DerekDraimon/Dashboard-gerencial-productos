import type { ErrorRequestHandler } from 'express';
import { AppError, type ErrorResponseBody } from '../errors/app-error.js';

/** Shape of the error `express.json()` raises for an unparsable body. */
function isJsonParseError(error: unknown): boolean {
  return (
    error instanceof SyntaxError &&
    'type' in error &&
    (error as { type?: unknown }).type === 'entity.parse.failed'
  );
}

/**
 * Centralized Express error middleware. It must be registered last.
 *
 * - `AppError` -> its own status, code, message and optional details.
 * - Malformed JSON body -> 400 `INVALID_JSON`.
 * - Anything else -> 500 `INTERNAL_ERROR`; the real error is logged server side and
 *   neither its message nor its stack reaches the client.
 *
 * Express 5 forwards rejected promises from async handlers here automatically.
 */
export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof AppError) {
    const body: ErrorResponseBody = { error: { code: error.code, message: error.message } };
    if (error.details !== undefined) {
      body.error.details = error.details;
    }
    res.status(error.status).json(body);
    return;
  }

  if (isJsonParseError(error)) {
    const body: ErrorResponseBody = {
      error: { code: 'INVALID_JSON', message: 'Request body contains malformed JSON' },
    };
    res.status(400).json(body);
    return;
  }

  console.error('Unexpected error:', error);
  const body: ErrorResponseBody = {
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
  };
  res.status(500).json(body);
};
