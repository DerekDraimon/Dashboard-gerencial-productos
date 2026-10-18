import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { apiRouter } from './routes/index.js';
import type { TrustProxy } from './shared/config/env.js';
import { JSON_BODY_LIMIT } from './shared/http/body-limit.js';
import { errorHandler } from './shared/middlewares/error-handler.js';
import { notFoundHandler } from './shared/middlewares/not-found.js';

export interface AppOptions {
  corsOrigin?: string;
  /** Only set behind a reverse proxy, so `req.ip` (and the login rate limit) uses `X-Forwarded-For`. */
  trustProxy?: TrustProxy;
}

export function createApp(options: AppOptions = {}): Express {
  const app = express();

  app.disable('x-powered-by');
  if (options.trustProxy !== undefined) {
    app.set('trust proxy', options.trustProxy);
  }
  app.use(helmet());
  app.use(cors({ origin: options.corsOrigin ?? 'http://localhost:5173' }));
  app.use(express.json({ limit: JSON_BODY_LIMIT }));

  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
