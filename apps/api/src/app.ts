import cors from 'cors';
import express, { type Express } from 'express';
import { errorHandler, notFound } from './middleware/error-handler';
import { healthRouter } from './modules/health/health.router';

export interface AppDeps {
  corsOrigin: string;
  version: string;
}

/** Builds the Express app without listening, so tests can drive it with Supertest. */
export function createApp(deps: AppDeps): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: deps.corsOrigin }));
  app.use(express.json({ limit: '100kb' }));

  app.use('/health', healthRouter(deps.version));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
