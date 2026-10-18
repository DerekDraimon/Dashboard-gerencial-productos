/** Shared by the Mongoose model and the Zod schemas so both enforce the same limits. */
export const PRODUCT_LIMITS = {
  titleMaxLength: 120,
  descriptionMaxLength: 2000,
  categoryMaxLength: 60,
  maxImages: 10,
} as const;
