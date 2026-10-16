import type { RequestHandler } from 'express';
import { z } from 'zod';
import { AppError } from '../errors/app-error.js';
import { setValidated } from '../middlewares/validate.js';

/** 24-char hex string; stricter than Mongoose's `isValidObjectId`, which also accepts 12-char strings. */
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

/** `{ id }` route params, as stored by {@link validateObjectIdParam}. */
export const idParamsSchema = z.object({ id: objectIdSchema });

export type IdParams = z.output<typeof idParamsSchema>;

/**
 * Validates `req.params.id` as a MongoDB ObjectId. A malformed id answers
 * 400 `INVALID_ID` (not `VALIDATION_ERROR`) so clients can tell it apart from body errors.
 * The parsed params are readable with `validated<typeof idParamsSchema>(res, 'params')`.
 */
export const validateObjectIdParam: RequestHandler = (req, res, next) => {
  const result = idParamsSchema.safeParse(req.params);
  if (!result.success) {
    next(new AppError(400, 'INVALID_ID', 'The id is not a valid identifier'));
    return;
  }
  setValidated(res, 'params', result.data);
  next();
};
