import jwt from 'jsonwebtoken';
import { usersService, type User, type UserRole } from '../../src/modules/users/index.js';
import { signToken } from '../../src/shared/auth/jwt.js';

export const TEST_JWT_SECRET = 'test-secret-that-is-at-least-32-chars';

process.env.JWT_SECRET = TEST_JWT_SECRET;
process.env.JWT_EXPIRES_IN = '1h';

export interface UserWithToken {
  user: User;
  token: string;
}

export async function createUserWithToken(
  role: UserRole,
  email = `${role.toLowerCase()}@auth.test`,
): Promise<UserWithToken> {
  const user = await usersService.createUser({ email, password: 'secret123', name: role, role });
  return { user, token: signToken({ sub: user.id, role: user.role }) };
}

export function bearer(token: string): string {
  return `Bearer ${token}`;
}

export function signExpiredToken(sub: string, role: UserRole): string {
  const exp = Math.floor(Date.now() / 1000) - 60;
  return jwt.sign({ sub, role, exp }, TEST_JWT_SECRET);
}
