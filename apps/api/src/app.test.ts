import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app';

describe('API app', () => {
  const app = createApp({ corsOrigin: '*', version: 'test' });

  it('reports healthy on GET /health', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', service: 'salary-api', version: 'test' });
  });

  it('answers unknown routes with 404 in the standard error shape', async () => {
    const res = await request(app).get('/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'Route GET /does-not-exist not found' },
    });
  });
});
