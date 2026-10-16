import { z } from 'zod';

export const loginBodySchema = z
  .object({
    email: z
      .string({ error: 'email is required' })
      .trim()
      .toLowerCase()
      .pipe(z.email('email must be a valid email address')),
    password: z.string({ error: 'password is required' }).min(1, 'password is required'),
  })
  .strict();
