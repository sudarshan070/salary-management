import { createClient } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import * as schema from './schema';

export type Db = LibSQLDatabase<typeof schema>;

export interface DbConfig {
  url: string;
  authToken?: string | undefined;
}

/** Same code path for a local SQLite file and a hosted Turso database (ADR 0003). */
export function createDb({ url, authToken }: DbConfig): Db {
  const client = createClient(authToken ? { url, authToken } : { url });
  return drizzle(client, { schema });
}

export async function runMigrations(db: Db, migrationsFolder: string): Promise<void> {
  await migrate(db, { migrationsFolder });
}
