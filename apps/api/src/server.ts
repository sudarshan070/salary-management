import { fileURLToPath } from 'node:url';
import { createApp } from './app';
import { loadConfig } from './config';
import { createDb, runMigrations } from './db/client';
import { seedIfEmpty } from './seed/seed-if-empty';

const config = loadConfig(process.env);
const db = createDb({ url: config.databaseUrl, authToken: config.databaseAuthToken });

// src/server.ts and dist/server.js both sit one level below apps/api, next to drizzle/.
await runMigrations(db, fileURLToPath(new URL('../drizzle', import.meta.url)));
if (config.seedIfEmpty) {
  const inserted = await seedIfEmpty(db, new Date());
  if (inserted > 0) console.log(`Seeded ${inserted} employees into an empty database`);
}

const app = createApp({ corsOrigin: config.corsOrigin, version: config.version, db });
app.listen(config.port, () => {
  console.log(`salary-api listening on port ${config.port}`);
});
