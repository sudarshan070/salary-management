import type { EmployeeInput } from '@salary/shared';
import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { seedDatabase } from '../../seed/seed-database';
import { createTestApp } from '../../test/test-app';

let n = 0;
function person(
  countryCode: EmployeeInput['countryCode'],
  jobTitle: string,
  salaryMinor: number,
  extra: Partial<EmployeeInput> = {},
): EmployeeInput {
  n += 1;
  return {
    fullName: `Person ${n}`,
    email: `person${n}@acme.example`,
    jobTitle,
    department: 'Engineering',
    countryCode,
    salaryMinor,
    employmentType: 'full-time',
    hireDate: '2024-01-01',
    ...extra,
  };
}

// India: 4 people (even count), US: 3 people (odd count) — exercises both median cases.
const people = [
  person('IN', 'Engineer', 100),
  person('IN', 'Engineer', 300),
  person('IN', 'Manager', 200, { department: 'Management' }),
  person('IN', 'Manager', 401, { department: 'Management', employmentType: 'contract' }),
  person('US', 'Engineer', 10),
  person('US', 'Engineer', 30),
  person('US', 'Engineer', 20),
];

describe('insights API', () => {
  let app: Express;

  beforeAll(async () => {
    const t = await createTestApp();
    app = t.app;
    await seedDatabase(t.db, people, '2026-09-01T00:00:00.000Z');
  });

  it('GET /insights/countries returns headcount, min, max, average and median per country', async () => {
    const res = await request(app).get('/api/v1/insights/countries');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        countryCode: 'IN',
        countryName: 'India',
        currency: 'INR',
        headcount: 4,
        minSalary: 100,
        maxSalary: 401,
        averageSalary: 250,
        medianSalary: 250,
      },
      {
        countryCode: 'US',
        countryName: 'United States',
        currency: 'USD',
        headcount: 3,
        minSalary: 10,
        maxSalary: 30,
        averageSalary: 20,
        medianSalary: 20,
      },
    ]);
  });

  it('GET /insights/countries/:code/job-titles breaks a country down by job title, highest paid first', async () => {
    const res = await request(app).get('/api/v1/insights/countries/IN/job-titles');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      countryCode: 'IN',
      countryName: 'India',
      currency: 'INR',
      jobTitles: [
        { jobTitle: 'Manager', headcount: 2, minSalary: 200, maxSalary: 401, averageSalary: 301 },
        { jobTitle: 'Engineer', headcount: 2, minSalary: 100, maxSalary: 300, averageSalary: 200 },
      ],
    });
  });

  it('returns an empty breakdown for a supported country with no employees', async () => {
    const res = await request(app).get('/api/v1/insights/countries/JP/job-titles');

    expect(res.status).toBe(200);
    expect(res.body.jobTitles).toEqual([]);
  });

  it('rejects an unsupported country code', async () => {
    const res = await request(app).get('/api/v1/insights/countries/XX/job-titles');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('GET /insights/overview summarises the organisation', async () => {
    const res = await request(app).get('/api/v1/insights/overview');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      totalEmployees: 7,
      countries: 2,
      departments: 2,
      jobTitles: 2,
      byEmploymentType: [
        { employmentType: 'full-time', headcount: 6 },
        { employmentType: 'contract', headcount: 1 },
      ],
      byDepartment: [
        { department: 'Engineering', headcount: 5 },
        { department: 'Management', headcount: 2 },
      ],
    });
  });

  it('GET /meta/filters lists supported countries and the departments and titles in use', async () => {
    const res = await request(app).get('/api/v1/meta/filters');

    expect(res.status).toBe(200);
    expect(res.body.countries).toContainEqual({ code: 'IN', name: 'India', currency: 'INR' });
    expect(res.body.departments).toEqual(['Engineering', 'Management']);
    expect(res.body.jobTitles).toEqual(['Engineer', 'Manager']);
  });
});
