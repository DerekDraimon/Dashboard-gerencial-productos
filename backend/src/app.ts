import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './shared/middlewares/error-handler.js';
import { notFoundHandler } from './shared/middlewares/not-found.js';

export interface AppOptions {
  /** Origin allowed by CORS (the frontend URL). */
  corsOrigin?: string;
}

/** Builds the Express application without listening, so tests can drive it with Supertest. */
export function createApp(options: AppOptions = {}): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: options.corsOrigin ?? 'http://localhost:5173' }));
  app.use(express.json({ limit: '100kb' }));

  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
