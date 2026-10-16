import { signToken } from '../../shared/auth/jwt.js';
import { AppError } from '../../shared/errors/app-error.js';
import { usersService } from '../users/index.js';
import type { LoginInput, LoginResult } from './auth.types.js';

/** bcrypt hash of a throwaway string, compared against when the email is unknown. */
const DUMMY_HASH = '$2b$10$aufxBsxpbY3y75VPYqPM8eT2pdiKWDMJ0jmEtwR895M4XirOckePe';

/**
 * Unknown email and wrong password share one 401 and both pay for a bcrypt compare, so neither
 * the body nor the response time reveals which emails are registered. The inactive check runs
 * only after the password matches for the same reason.
 */
export async function login({ email, password }: LoginInput): Promise<LoginResult> {
  const found = await usersService.findByEmailWithPassword(email);
  const passwordMatches = await usersService.verifyPassword(
    password,
    found?.password ?? DUMMY_HASH,
  );
  if (!found || !passwordMatches) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }
  if (!found.active) {
    throw new AppError(403, 'USER_INACTIVE', 'This user is inactive');
  }

  const { password: _password, ...user } = found;
  void _password;
  return { token: signToken({ sub: user.id, role: user.role }), user };
}
