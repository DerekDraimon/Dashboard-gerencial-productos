import type { RequestHandler } from 'express';
import type { idParamsSchema } from '../../shared/http/object-id.js';
import { validated } from '../../shared/middlewares/validate.js';
import type {
  createUserBodySchema,
  listUsersQuerySchema,
  updateUserBodySchema,
  updateUserStatusBodySchema,
} from './users.schemas.js';
import * as usersService from './users.service.js';

/** HTTP adapters: read validated input, call the service, write the response. */

export const listUsers: RequestHandler = async (_req, res) => {
  const query = validated<typeof listUsersQuerySchema>(res, 'query');
  res.json(await usersService.listUsers(query));
};

export const getUser: RequestHandler = async (_req, res) => {
  const { id } = validated<typeof idParamsSchema>(res, 'params');
  res.json(await usersService.getUserById(id));
};

export const createUser: RequestHandler = async (_req, res) => {
  const body = validated<typeof createUserBodySchema>(res, 'body');
  res.status(201).json(await usersService.createUser(body));
};

export const updateUser: RequestHandler = async (_req, res) => {
  const { id } = validated<typeof idParamsSchema>(res, 'params');
  const body = validated<typeof updateUserBodySchema>(res, 'body');
  res.json(await usersService.updateUser(id, body));
};

export const updateUserStatus: RequestHandler = async (_req, res) => {
  const { id } = validated<typeof idParamsSchema>(res, 'params');
  const { active } = validated<typeof updateUserStatusBodySchema>(res, 'body');
  res.json(await usersService.setUserStatus(id, active));
};
