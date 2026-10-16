import { Router } from 'express';
import { validateObjectIdParam } from '../../shared/http/object-id.js';
import { requireDb } from '../../shared/middlewares/require-db.js';
import { validate } from '../../shared/middlewares/validate.js';
import * as controller from './users.controller.js';
import {
  createUserBodySchema,
  listUsersQuerySchema,
  updateUserBodySchema,
  updateUserStatusBodySchema,
} from './users.schemas.js';

/** `/api/users`. Every route needs MongoDB. Auth guards are added with the auth module. */
export const usersRouter = Router();

usersRouter.use(requireDb);

usersRouter.get('/', validate({ query: listUsersQuerySchema }), controller.listUsers);
usersRouter.post('/', validate({ body: createUserBodySchema }), controller.createUser);
usersRouter.get('/:id', validateObjectIdParam, controller.getUser);
usersRouter.patch(
  '/:id',
  validateObjectIdParam,
  validate({ body: updateUserBodySchema }),
  controller.updateUser,
);
usersRouter.patch(
  '/:id/status',
  validateObjectIdParam,
  validate({ body: updateUserStatusBodySchema }),
  controller.updateUserStatus,
);
