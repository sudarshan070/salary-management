import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGIN: z.string().min(1).default('*'),
  APP_VERSION: z.string().default('0.1.0'),
  DATABASE_URL: z.string().min(1).default('file:local.db'),
  DATABASE_AUTH_TOKEN: z.string().min(1).optional(),
  SEED_IF_EMPTY: z.enum(['true', 'false']).default('false'),
});

export interface AppConfig {
  port: number;
  corsOrigin: string;
  version: string;
  databaseUrl: string;
  databaseAuthToken: string | undefined;
  /** Seed 10,000 employees on startup when the table is empty (first deploy). */
  seedIfEmpty: boolean;
}

/** Reads and validates environment variables once, at startup. */
export function loadConfig(env: Record<string, string | undefined>): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`Invalid environment configuration: ${fields}`);
  }
  return {
    port: parsed.data.PORT,
    corsOrigin: parsed.data.CORS_ORIGIN,
    version: parsed.data.APP_VERSION,
    databaseUrl: parsed.data.DATABASE_URL,
    databaseAuthToken: parsed.data.DATABASE_AUTH_TOKEN,
    seedIfEmpty: parsed.data.SEED_IF_EMPTY === 'true',
  };
}
