import { currencyForCountry, type CountryCode } from '@salary/shared';
import { count, eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { employees } from '../db/schema';
import { createTestDb } from '../test/test-db';
import { generateEmployees } from './generate-employees';
import { seedDatabase } from './seed-database';

const NOW = '2026-10-01T09:00:00.000Z';

describe('seedDatabase', () => {
  it('inserts every employee with a sequential code and its country currency', async () => {
    const db = await createTestDb();
    const input = generateEmployees({ count: 1_200, seed: 1, today: '2026-10-01' });

    await seedDatabase(db, input, NOW);

    const [total] = await db.select({ n: count() }).from(employees);
    expect(total?.n).toBe(1_200);
    const first = await db.query.employees.findFirst({ where: eq(employees.id, 1) });
    expect(first?.employeeCode).toBe('EMP-000001');
    expect(first?.currency).toBe(currencyForCountry(first?.countryCode as CountryCode));
    expect(first?.createdAt).toBe(NOW);
  });

  it('replaces existing data when run again', async () => {
    const db = await createTestDb();
    const input = generateEmployees({ count: 300, seed: 1, today: '2026-10-01' });

    await seedDatabase(db, input, NOW);
    await seedDatabase(db, input, NOW);

    const [total] = await db.select({ n: count() }).from(employees);
    expect(total?.n).toBe(300);
  });
});
