import { count } from 'drizzle-orm';
import type { Db } from '../db/client';
import { employees } from '../db/schema';
import { generateEmployees } from './generate-employees';
import { seedDatabase } from './seed-database';

export const SEED = { count: 10_000, seed: 20261001 } as const;

/** Seeds the standard 10,000 employees only when the table is empty. Returns rows inserted. */
export async function seedIfEmpty(db: Db, now: Date): Promise<number> {
  const [row] = await db.select({ n: count() }).from(employees);
  if ((row?.n ?? 0) > 0) return 0;
  const today = now.toISOString().slice(0, 10);
  await seedDatabase(db, generateEmployees({ ...SEED, today }), now.toISOString());
  return SEED.count;
}
