import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { createTestDb } from '../test/test-db';
import { employees } from './schema';

const row = {
  employeeCode: 'EMP-000001',
  fullName: 'Asha Rao',
  email: 'asha@acme.example',
  jobTitle: 'Software Engineer',
  department: 'Engineering',
  countryCode: 'IN',
  currency: 'INR',
  salaryMinor: 180_000_000,
  employmentType: 'full-time' as const,
  hireDate: '2023-04-01',
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
};

describe('database migrations', () => {
  it('create the employees table with the insight indexes', async () => {
    const db = await createTestDb();

    const indexes = await db.all<{ name: string }>(
      sql`SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'employees'`,
    );

    expect(indexes.map((i) => i.name)).toEqual(
      expect.arrayContaining(['employees_country_job_title_idx', 'employees_country_salary_idx']),
    );
  });

  it('enforce unique emails', async () => {
    const db = await createTestDb();
    await db.insert(employees).values(row);

    await expect(
      db.insert(employees).values({ ...row, employeeCode: 'EMP-000002' }),
    ).rejects.toThrow();
  });
});
