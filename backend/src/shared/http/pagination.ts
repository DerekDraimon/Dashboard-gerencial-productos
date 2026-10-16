import { z } from 'zod';

export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;

export const paginationQuerySchema = z.object({
  offset: z.coerce
    .number({ error: 'offset must be a number' })
    .int('offset must be an integer')
    .min(0, 'offset must be 0 or greater')
    .default(0),
  limit: z.coerce
    .number({ error: 'limit must be a number' })
    .int('limit must be an integer')
    .min(1, 'limit must be at least 1')
    .max(MAX_LIMIT, `limit must be at most ${MAX_LIMIT}`)
    .default(DEFAULT_LIMIT),
});

export type PaginationQuery = z.output<typeof paginationQuerySchema>;

export interface Page<T> {
  data: T[];
  meta: {
    /** Number of items matching the filters, ignoring offset and limit. */
    total: number;
    offset: number;
    limit: number;
  };
}

export const booleanQueryFlag = (name: string) =>
  z
    .enum(['true', 'false'], { error: `${name} must be true or false` })
    .transform((value) => value === 'true');
