import type { HealthResponse } from '@salary/shared';
import { Router } from 'express';

export function healthRouter(version: string): Router {
  const router = Router();
  router.get('/', (_req, res) => {
    const body: HealthResponse = { status: 'ok', service: 'salary-api', version };
    res.json(body);
  });
  return router;
}
