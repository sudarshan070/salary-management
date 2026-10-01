import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from './test/test-app';

describe('API documentation', () => {
  let app: Express;
  beforeAll(async () => {
    ({ app } = await createTestApp());
  });

  it('serves an OpenAPI document generated from the shared schemas', async () => {
    const res = await request(app).get('/openapi.json');

    expect(res.status).toBe(200);
    expect(res.body.openapi).toMatch(/^3\./);
    expect(Object.keys(res.body.paths)).toEqual(
      expect.arrayContaining([
        '/api/v1/employees',
        '/api/v1/employees/{id}',
        '/api/v1/insights/overview',
        '/api/v1/insights/countries',
        '/api/v1/insights/countries/{code}/job-titles',
        '/api/v1/meta/filters',
        '/health',
      ]),
    );
    expect(res.body.components.schemas.Employee.properties.salaryMinor).toBeDefined();
  });

  it('serves interactive docs at /docs', async () => {
    const res = await request(app).get('/docs/');

    expect(res.status).toBe(200);
    expect(res.text).toContain('swagger-ui');
  });
});
