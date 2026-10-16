import { Router } from 'express';
import { healthRouter } from './health.routes.js';

/** Mounts every API router under `/api`. Module routers are registered here through their `index.ts`. */
export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
