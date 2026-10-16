import type { RequestHandler } from 'express';
import { unauthenticatedError } from '../../shared/auth/authorize.js';
import { validated } from '../../shared/middlewares/validate.js';
import { usersService } from '../users/index.js';
import type { loginBodySchema } from './auth.schemas.js';
import * as authService from './auth.service.js';

export const login: RequestHandler = async (_req, res) => {
  const body = validated<typeof loginBodySchema>(res, 'body');
  res.json(await authService.login(body));
};

export const me: RequestHandler = async (req, res) => {
  if (!req.auth) {
    throw unauthenticatedError();
  }
  res.json(await usersService.getUserById(req.auth.sub));
};
