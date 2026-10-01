import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { seedIfEmpty } from './seed/seed-if-empty';
import { createTestApp } from './test/test-app';

// Budget from the requirements: list and insight requests under 200 ms on 10,000 rows.
const BUDGET_MS = 200;

async function timed(app: Express, url: string) {
  await request(app).get(url); // warm-up: first query also prepares statements
  const started = performance.now();
  const res = await request(app).get(url);
  return { res, ms: performance.now() - started };
}

describe('performance with 10,000 employees', () => {
  let app: Express;

  beforeAll(async () => {
    const t = await createTestApp();
    app = t.app;
    await seedIfEmpty(t.db, new Date('2026-10-01T00:00:00Z'));
  }, 30_000);

  it.each([
    '/api/v1/employees?pageSize=100',
    '/api/v1/employees?search=sharma&country=IN&sort=-salary',
    '/api/v1/employees?page=90&pageSize=100&sort=hireDate',
    '/api/v1/insights/overview',
    '/api/v1/insights/countries',
    '/api/v1/insights/countries/US/job-titles',
    '/api/v1/meta/filters',
  ])(`answers %s within ${BUDGET_MS} ms`, async (url) => {
    const { res, ms } = await timed(app, url);

    expect(res.status).toBe(200);
    expect(ms).toBeLessThan(BUDGET_MS);
  });

  it('reports the full 10,000 headcount', async () => {
    const res = await request(app).get('/api/v1/insights/overview');
    expect(res.body.totalEmployees).toBe(10_000);
  });
});
