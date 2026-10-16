import jwt, { type SignOptions } from 'jsonwebtoken';
import { AppError } from '../errors/app-error.js';

export interface TokenPayload {
  sub: string;
  role: string;
}

/**
 * Read at call time instead of import time: `loadEnv()` validates and loads `.env` on startup,
 * after this module has already been imported.
 */
function readJwtConfig(): { secret: string; expiresIn: string } {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return { secret, expiresIn: process.env.JWT_EXPIRES_IN ?? '1d' };
}

export function invalidTokenError(): AppError {
  return new AppError(401, 'INVALID_TOKEN', 'The access token is invalid or has expired');
}

export function signToken(payload: TokenPayload): string {
  const { secret, expiresIn } = readJwtConfig();
  return jwt.sign({ sub: payload.sub, role: payload.role }, secret, {
    algorithm: 'HS256',
    expiresIn: expiresIn as SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): TokenPayload {
  const { secret } = readJwtConfig();
  let decoded: string | jwt.JwtPayload;
  try {
    decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
  } catch {
    throw invalidTokenError();
  }
  if (typeof decoded === 'string') {
    throw invalidTokenError();
  }
  const { sub, role } = decoded as { sub?: unknown; role?: unknown };
  if (typeof sub !== 'string' || typeof role !== 'string') {
    throw invalidTokenError();
  }
  return { sub, role };
}
