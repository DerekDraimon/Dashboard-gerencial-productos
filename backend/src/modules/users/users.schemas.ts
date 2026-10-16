import { z } from 'zod';
import { booleanQueryFlag, paginationQuerySchema } from '../../shared/http/pagination.js';
import { USER_ROLES } from './users.types.js';

const PASSWORD_MAX_BYTES = 72;

const emailSchema = z
  .string({ error: 'email is required' })
  .trim()
  .toLowerCase()
  .pipe(z.email('email must be a valid email address'));

const nameSchema = z
  .string({ error: 'name is required' })
  .trim()
  .min(1, 'name is required')
  .max(100, 'name must be at most 100 characters');

const roleSchema = z.enum(USER_ROLES, { error: `role must be one of ${USER_ROLES.join(', ')}` });

const activeSchema = z.boolean({ error: 'active must be a boolean' });

export const createUserBodySchema = z
  .object({
    email: emailSchema,
    password: z
      .string({ error: 'password is required' })
      .min(8, 'password must be at least 8 characters')
      // bcrypt ignores everything past 72 bytes, so longer passwords would be silently truncated.
      .refine((password) => Buffer.byteLength(password, 'utf8') <= PASSWORD_MAX_BYTES, {
        message: `password is too long: it must be at most ${PASSWORD_MAX_BYTES} bytes`,
      }),
    name: nameSchema,
    role: roleSchema.optional(),
  })
  .strict();

/** Email and password are not editable here; `.strict()` turns them into 400s. */
export const updateUserBodySchema = z
  .object({
    name: nameSchema.optional(),
    role: roleSchema.optional(),
    active: activeSchema.optional(),
  })
  .strict()
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: 'At least one of name, role or active is required',
  });

export const updateUserStatusBodySchema = z.object({ active: activeSchema }).strict();

export const listUsersQuerySchema = paginationQuerySchema.extend({
  active: booleanQueryFlag('active').optional(),
});
