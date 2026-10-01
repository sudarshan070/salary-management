import type { Express } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Db } from '../../db/client';
import { seedDatabase } from '../../seed/seed-database';
import { createTestApp } from '../../test/test-app';

const base = {
  jobTitle: 'Software Engineer',
  department: 'Engineering',
  salaryMinor: 180_000_000,
  employmentType: 'full-time' as const,
  hireDate: '2023-04-01',
};

const people = [
  { ...base, fullName: 'Asha Rao', email: 'asha@acme.example', countryCode: 'IN' as const },
  {
    ...base,
    fullName: 'Ben Carter',
    email: 'ben@acme.example',
    countryCode: 'US' as const,
    salaryMinor: 15_000_000,
  },
  {
    ...base,
    fullName: 'Chen Wei',
    email: 'chen@acme.example',
    countryCode: 'SG' as const,
    jobTitle: 'Product Manager',
    department: 'Product',
  },
];

describe('/api/v1/employees', () => {
  let app: Express;
  let db: Db;

  beforeEach(async () => {
    ({ app, db } = await createTestApp());
    await seedDatabase(db, people, '2026-09-01T00:00:00.000Z');
  });

  describe('GET /', () => {
    it('lists employees sorted by name with pagination metadata', async () => {
      const res = await request(app).get('/api/v1/employees');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ page: 1, pageSize: 25, total: 3, totalPages: 1 });
      expect(res.body.data.map((e: { fullName: string }) => e.fullName)).toEqual([
        'Asha Rao',
        'Ben Carter',
        'Chen Wei',
      ]);
    });

    it('filters by country and searches by name or email', async () => {
      const byCountry = await request(app).get('/api/v1/employees?country=US');
      expect(byCountry.body.data).toHaveLength(1);
      expect(byCountry.body.data[0].fullName).toBe('Ben Carter');

      const bySearch = await request(app).get('/api/v1/employees?search=chen@');
      expect(bySearch.body.total).toBe(1);
    });

    it('filters by job title and department', async () => {
      const res = await request(app).get(
        '/api/v1/employees?department=Product&jobTitle=Product%20Manager',
      );
      expect(res.body.data.map((e: { fullName: string }) => e.fullName)).toEqual(['Chen Wei']);
    });

    it('sorts by salary descending and pages through results', async () => {
      const res = await request(app).get('/api/v1/employees?sort=-salary&pageSize=2&page=2');

      expect(res.body).toMatchObject({ page: 2, pageSize: 2, total: 3, totalPages: 2 });
      expect(res.body.data.map((e: { fullName: string }) => e.fullName)).toEqual(['Ben Carter']);
    });

    it('rejects an invalid query with a validation error', async () => {
      const res = await request(app).get('/api/v1/employees?pageSize=1000');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details[0].path).toBe('pageSize');
    });
  });

  describe('GET /:id', () => {
    it('returns one employee', async () => {
      const res = await request(app).get('/api/v1/employees/1');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: 1, employeeCode: 'EMP-000001', currency: 'INR' });
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(app).get('/api/v1/employees/999');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('EMPLOYEE_NOT_FOUND');
    });
  });

  describe('POST /', () => {
    const newHire = {
      ...base,
      fullName: 'Dana Fischer',
      email: 'dana@acme.example',
      countryCode: 'DE',
      salaryMinor: 6_500_000,
    };

    it('creates an employee with a code and the country currency', async () => {
      const res = await request(app).post('/api/v1/employees').send(newHire);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        ...newHire,
        id: 4,
        employeeCode: 'EMP-000004',
        currency: 'EUR',
      });
      expect(res.headers.location).toBe('/api/v1/employees/4');
    });

    it('returns field-level details for an invalid body', async () => {
      const res = await request(app)
        .post('/api/v1/employees')
        .send({ ...newHire, email: 'nope' });

      expect(res.status).toBe(400);
      expect(res.body.error.details).toEqual([expect.objectContaining({ path: 'email' })]);
    });

    it('returns 409 when the email is already used', async () => {
      const res = await request(app)
        .post('/api/v1/employees')
        .send({ ...newHire, email: 'asha@acme.example' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('EMAIL_TAKEN');
    });

    it('returns 400 for malformed JSON', async () => {
      const res = await request(app)
        .post('/api/v1/employees')
        .set('content-type', 'application/json')
        .send('{"fullName":');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_JSON');
    });
  });

  describe('PATCH /:id', () => {
    it('updates only the given fields', async () => {
      const res = await request(app).patch('/api/v1/employees/2').send({ salaryMinor: 16_000_000 });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: 2, fullName: 'Ben Carter', salaryMinor: 16_000_000 });
      expect(res.body.updatedAt).toBe('2026-10-01T09:00:00.000Z');
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(app).patch('/api/v1/employees/999').send({ salaryMinor: 1 });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /:id', () => {
    it('deletes the employee', async () => {
      const res = await request(app).delete('/api/v1/employees/3');
      expect(res.status).toBe(204);

      const after = await request(app).get('/api/v1/employees/3');
      expect(after.status).toBe(404);
    });
  });
});
