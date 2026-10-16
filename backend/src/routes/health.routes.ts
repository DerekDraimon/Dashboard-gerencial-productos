import { Router } from 'express';
import { isDatabaseConnected } from '../shared/db/connection.js';

export const healthRouter = Router();

/** Liveness plus database status. Never guarded by `requireDb`: it must answer while Mongo is down. */
healthRouter.get('/', (_req, res) => {
  if (isDatabaseConnected()) {
    res.status(200).json({ status: 'ok', database: 'connected' });
    return;
  }
  res.status(503).json({ status: 'degraded', database: 'disconnected' });
});
