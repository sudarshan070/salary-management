import { COUNTRY_CODES } from '@salary/shared';
import { Router } from 'express';
import { z } from 'zod';
import { parse } from '../../http/parse';
import type { InsightsService } from './insights.service';

const countryParamSchema = z.object({ code: z.enum(COUNTRY_CODES) });

export function insightsRouter(service: InsightsService): Router {
  const router = Router();

  router.get('/overview', async (_req, res) => {
    res.json(await service.overview());
  });

  router.get('/countries', async (_req, res) => {
    res.json(await service.countries());
  });

  router.get('/countries/:code/job-titles', async (req, res) => {
    const { code } = parse(countryParamSchema, req.params);
    res.json(await service.jobTitles(code));
  });

  return router;
}

export function metaRouter(service: InsightsService): Router {
  const router = Router();
  router.get('/filters', async (_req, res) => {
    res.json(await service.filters());
  });
  return router;
}
