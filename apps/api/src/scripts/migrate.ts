import { fileURLToPath } from 'node:url';
import { loadConfig } from '../config';
import { createDb, runMigrations } from '../db/client';

const config = loadConfig(process.env);
const db = createDb({ url: config.databaseUrl, authToken: config.databaseAuthToken });
await runMigrations(db, fileURLToPath(new URL('../../drizzle', import.meta.url)));
console.log(`Migrations applied to ${config.databaseUrl}`);
