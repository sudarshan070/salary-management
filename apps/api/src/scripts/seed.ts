import { fileURLToPath } from 'node:url';
import { loadConfig } from '../config';
import { createDb, runMigrations } from '../db/client';
import { generateEmployees } from '../seed/generate-employees';
import { seedDatabase } from '../seed/seed-database';
import { SEED } from '../seed/seed-if-empty';

// Replaces ALL employees with the standard 10,000-row data set.
const config = loadConfig(process.env);
const db = createDb({ url: config.databaseUrl, authToken: config.databaseAuthToken });
await runMigrations(db, fileURLToPath(new URL('../../drizzle', import.meta.url)));

const started = performance.now();
const now = new Date();
await seedDatabase(
  db,
  generateEmployees({ ...SEED, today: now.toISOString().slice(0, 10) }),
  now.toISOString(),
);
console.log(`Seeded ${SEED.count} employees in ${Math.round(performance.now() - started)} ms`);
