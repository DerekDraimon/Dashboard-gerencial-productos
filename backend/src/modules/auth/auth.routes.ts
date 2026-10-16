import { Router } from 'express';
import { validate } from '../../shared/middlewares/validate.js';
import * as controller from './auth.controller.js';
import { loginBodySchema } from './auth.schemas.js';
import { authenticate } from './authenticate.js';
import { loginRateLimit } from './login-rate-limit.js';

export const authRouter = Router();

authRouter.post('/login', loginRateLimit, validate({ body: loginBodySchema }), controller.login);
authRouter.get('/me', authenticate, controller.me);
