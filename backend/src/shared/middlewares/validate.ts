import type { RequestHandler, Response } from 'express';
import type { ZodError, ZodType, z } from 'zod';
import { AppError } from '../errors/app-error.js';

/** Request parts the middleware can validate. */
export type RequestPart = 'body' | 'query' | 'params';

/** One entry of `error.details` in a 400 `VALIDATION_ERROR` response. */
export interface ValidationIssue {
  /** Dot-separated field path (`''` for an object-level rule). */
  path: string;
  message: string;
}

export type ValidationSchemas = Partial<Record<RequestPart, ZodType>>;

type ValidatedLocals = Partial<Record<RequestPart, unknown>>;

const LOCALS_KEY = 'validated';

/** Turns Zod issues into the public `details` array. */
export function toValidationIssues(error: ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.map(String).join('.'),
    message: issue.message,
  }));
}

function readLocals(res: Response): ValidatedLocals {
  const current: unknown = res.locals[LOCALS_KEY];
  if (current !== undefined && typeof current === 'object' && current !== null) {
    return current as ValidatedLocals;
  }
  const fresh: ValidatedLocals = {};
  res.locals[LOCALS_KEY] = fresh;
  return fresh;
}

/** Stores an already validated value so handlers can read it with `validated()`. */
export function setValidated(res: Response, part: RequestPart, value: unknown): void {
  readLocals(res)[part] = value;
}

/**
 * Validates `body`, `query` and/or `params` with Zod schemas.
 *
 * Every part is checked and all issues are reported together as
 * 400 `VALIDATION_ERROR` with `details: [{ path, message }]`.
 *
 * Parsed values (defaults applied, strings coerced, unknown keys stripped) are stored
 * in `res.locals.validated` instead of being written back to `req`, because Express 5
 * exposes `req.query` as a read-only getter. Handlers read them with
 * {@link validated}, which keeps the schema's output type.
 */
export function validate(schemas: ValidationSchemas): RequestHandler {
  const parts = Object.entries(schemas) as [RequestPart, ZodType][];

  return (req, res, next) => {
    const issues: ValidationIssue[] = [];

    for (const [part, schema] of parts) {
      const result = schema.safeParse(req[part] ?? {});
      if (result.success) {
        setValidated(res, part, result.data);
      } else {
        issues.push(...toValidationIssues(result.error));
      }
    }

    if (issues.length > 0) {
      next(new AppError(400, 'VALIDATION_ERROR', 'Request validation failed', issues));
      return;
    }
    next();
  };
}

/**
 * Returns the value parsed by `validate()` (or `validateObjectIdParam()`) for a request part,
 * typed by the schema that validated it: `validated<typeof listQuerySchema>(res, 'query')`.
 *
 * @throws Error when no validator ran for that part (a routing mistake, not a client error).
 */
export function validated<S extends ZodType>(res: Response, part: RequestPart): z.output<S> {
  const locals = readLocals(res);
  if (!(part in locals)) {
    throw new Error(`No validated ${part} found: mount validate() on this route`);
  }
  return locals[part] as z.output<S>;
}
