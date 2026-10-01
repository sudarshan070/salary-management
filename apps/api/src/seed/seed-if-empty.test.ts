import { count } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { employees } from '../db/schema';
import { createTestDb } from '../test/test-db';
import { seedIfEmpty } from './seed-if-empty';

describe('seedIfEmpty', () => {
  it('seeds 10,000 employees into an empty database, then leaves it alone', async () => {
    const db = await createTestDb();
    const now = new Date('2026-10-01T09:00:00Z');

    expect(await seedIfEmpty(db, now)).toBe(10_000);
    expect(await seedIfEmpty(db, now)).toBe(0);

    const [total] = await db.select({ n: count() }).from(employees);
    expect(total?.n).toBe(10_000);
  });
});
