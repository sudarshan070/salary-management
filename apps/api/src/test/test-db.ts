import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDb, runMigrations, type Db } from '../db/client';

export const MIGRATIONS_FOLDER = fileURLToPath(new URL('../../drizzle', import.meta.url));

/**
 * A fresh, migrated SQLite database in its own temp file. A file (not :memory:)
 * keeps one database across libSQL transactions, which open new connections.
 */
export async function createTestDb(): Promise<Db> {
  const dir = mkdtempSync(join(tmpdir(), 'salary-test-'));
  const db = createDb({ url: `file:${join(dir, 'test.db')}` });
  await runMigrations(db, MIGRATIONS_FOLDER);
  return db;
}
