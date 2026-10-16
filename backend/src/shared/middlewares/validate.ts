import type { RequestHandler, Response } from 'express';
import type { ZodError, ZodType, z } from 'zod';
import { AppError } from '../errors/app-error.js';

export type RequestPart = 'body' | 'query' | 'params';

export interface ValidationIssue {
  path: string;
  message: string;
}

export type ValidationSchemas = Partial<Record<RequestPart, ZodType>>;

type ValidatedLocals = Partial<Record<RequestPart, unknown>>;

const LOCALS_KEY = 'validated';

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

export function setValidated(res: Response, part: RequestPart, value: unknown): void {
  readLocals(res)[part] = value;
}

/**
 * Parsed values go to `res.locals` instead of back to `req` because Express 5 exposes
 * `req.query` as a read-only getter; handlers read them with {@link validated}.
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

export function validated<S extends ZodType>(res: Response, part: RequestPart): z.output<S> {
  const locals = readLocals(res);
  if (!(part in locals)) {
    throw new Error(`No validated ${part} found: mount validate() on this route`);
  }
  return locals[part] as z.output<S>;
}
