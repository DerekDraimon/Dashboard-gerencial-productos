import type { RequestHandler } from 'express';
import { unauthenticatedError } from '../../shared/auth/authorize.js';
import { invalidTokenError, verifyToken } from '../../shared/auth/jwt.js';
import { usersService } from '../users/index.js';

const BEARER_PREFIX = 'Bearer ';

function readBearerToken(header: string | undefined): string | undefined {
  if (!header?.startsWith(BEARER_PREFIX)) {
    return undefined;
  }
  const token = header.slice(BEARER_PREFIX.length).trim();
  return token === '' ? undefined : token;
}

/**
 * Loads the user on every request instead of trusting the token alone, so a deactivated,
 * deleted or demoted user loses access immediately rather than when the token expires.
 * `req.auth.role` is therefore the stored role, not the one signed into the token.
 */
export const authenticate: RequestHandler = async (req, _res, next) => {
  const token = readBearerToken(req.headers.authorization);
  if (token === undefined) {
    next(unauthenticatedError());
    return;
  }

  const { sub } = verifyToken(token);
  const user = await usersService.findUserById(sub);
  if (!user?.active) {
    next(invalidTokenError());
    return;
  }

  req.auth = { sub: user.id, role: user.role };
  next();
};
