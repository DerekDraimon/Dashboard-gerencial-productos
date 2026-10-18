import { z } from 'zod';
import { paginationQuerySchema } from '../../shared/http/pagination.js';
import { PRODUCT_LIMITS } from './products.constants.js';

const { titleMaxLength, descriptionMaxLength, categoryMaxLength, maxImages } = PRODUCT_LIMITS;

const titleSchema = z
  .string({ error: 'title is required' })
  .trim()
  .min(1, 'title is required')
  .max(titleMaxLength, `title must be at most ${titleMaxLength} characters`);

const descriptionSchema = z
  .string({ error: 'description is required' })
  .trim()
  .min(1, 'description is required')
  .max(descriptionMaxLength, `description must be at most ${descriptionMaxLength} characters`);

/** Compared in cents with a tolerance because values like 25.99 are not exact in binary floating point. */
function hasAtMostTwoDecimals(value: number): boolean {
  const cents = value * 100;
  return Math.abs(cents - Math.round(cents)) < 1e-6;
}

const priceSchema = z
  .number({ error: 'price is required and must be a number' })
  .positive('price must be greater than 0')
  .refine(hasAtMostTwoDecimals, 'price must have at most 2 decimals');

const categorySchema = z
  .string({ error: 'category is required' })
  .trim()
  .min(1, 'category is required')
  .max(categoryMaxLength, `category must be at most ${categoryMaxLength} characters`);

const imagesSchema = z
  .array(z.url({ protocol: /^https?$/, error: 'each image must be an http(s) URL' }), {
    error: 'images must be an array of URLs',
  })
  .max(maxImages, `images must have at most ${maxImages} items`);

const stockSchema = z
  .number({ error: 'stock is required and must be a number' })
  .int('stock must be an integer')
  .min(0, 'stock must be 0 or greater');

export const createProductBodySchema = z
  .object({
    title: titleSchema,
    description: descriptionSchema,
    price: priceSchema,
    category: categorySchema,
    images: imagesSchema.optional(),
    stock: stockSchema,
  })
  .strict();

export const updateProductBodySchema = z
  .object({
    title: titleSchema.optional(),
    description: descriptionSchema.optional(),
    price: priceSchema.optional(),
    category: categorySchema.optional(),
    images: imagesSchema.optional(),
    stock: stockSchema.optional(),
  })
  .strict()
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: 'At least one field is required',
  });

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
