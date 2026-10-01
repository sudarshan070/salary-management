import cors from 'cors';
import express, { type Express } from 'express';
import type { Db } from './db/client';
import { errorHandler, notFound } from './middleware/error-handler';
import { DrizzleEmployeeRepository } from './modules/employees/employees.repository';
import { employeesRouter } from './modules/employees/employees.router';
import { EmployeeService, type Clock } from './modules/employees/employees.service';
import { healthRouter } from './modules/health/health.router';
import { InsightsRepository } from './modules/insights/insights.repository';
import { insightsRouter, metaRouter } from './modules/insights/insights.router';
import { InsightsService } from './modules/insights/insights.service';

export interface AppDeps {
  corsOrigin: string;
  version: string;
  db: Db;
  clock?: Clock;
}

/** Builds the Express app without listening, so tests can drive it with Supertest. */
export function createApp(deps: AppDeps): Express {
  const clock = deps.clock ?? (() => new Date());
  const employees = new EmployeeService(new DrizzleEmployeeRepository(deps.db), clock);
  const insights = new InsightsService(new InsightsRepository(deps.db));

  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: deps.corsOrigin }));
  app.use(express.json({ limit: '100kb' }));

  app.use('/health', healthRouter(deps.version));
  app.use('/api/v1/employees', employeesRouter(employees));
  app.use('/api/v1/insights', insightsRouter(insights));
  app.use('/api/v1/meta', metaRouter(insights));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
