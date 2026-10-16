import { z } from 'zod';
import { paginationQuerySchema } from '../../shared/http/pagination.js';

/** `YYYY-MM-DD` read as a UTC day; the round trip rejects impossible dates such as `2026-02-30`. */
const dayQuerySchema = (name: string) =>
  z
    .string({ error: `${name} must be a date in YYYY-MM-DD format` })
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${name} must be a date in YYYY-MM-DD format`)
    .transform((value, ctx) => {
      const date = new Date(`${value}T00:00:00.000Z`);
      if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
        ctx.addIssue({ code: 'custom', message: `${name} is not a valid date` });
        return z.NEVER;
      }
      return date;
    });

export const listProductsQuerySchema = paginationQuerySchema
  .extend({
    search: z
      .string({ error: 'search must be a single text value' })
      .trim()
      .transform((value) => (value === '' ? undefined : value))
      .optional(),
    from: dayQuerySchema('from').optional(),
    to: dayQuerySchema('to').optional(),
  })
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    message: 'from must be on or before to',
    path: ['from'],
  });
