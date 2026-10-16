import { Router } from 'express';
import { authenticate, authRouter } from '../modules/auth/index.js';
import { productsRouter } from '../modules/products/index.js';
import { usersRouter } from '../modules/users/index.js';
import { authorize } from '../shared/auth/authorize.js';
import { requireDb } from '../shared/middlewares/require-db.js';
import { healthRouter } from './health.routes.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', requireDb, authRouter);
apiRouter.use('/users', requireDb, authenticate, authorize('ADMIN'), usersRouter);
apiRouter.use('/products', requireDb, authenticate, productsRouter);
