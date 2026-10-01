import { describe, expect, it } from 'vitest';
import { loadConfig } from './config';

describe('loadConfig', () => {
  it('applies defaults when optional variables are missing', () => {
    expect(loadConfig({})).toEqual({
      port: 3000,
      corsOrigin: '*',
      version: '0.1.0',
      databaseUrl: 'file:local.db',
      databaseAuthToken: undefined,
      seedIfEmpty: false,
    });
  });

  it('reads PORT and CORS_ORIGIN from the environment', () => {
    const config = loadConfig({ PORT: '8080', CORS_ORIGIN: 'https://acme.example' });

    expect(config.port).toBe(8080);
    expect(config.corsOrigin).toBe('https://acme.example');
  });

  it('reads the Turso connection from DATABASE_URL and DATABASE_AUTH_TOKEN', () => {
    const config = loadConfig({
      DATABASE_URL: 'libsql://db.turso.io',
      DATABASE_AUTH_TOKEN: 'secret',
    });

    expect(config.databaseUrl).toBe('libsql://db.turso.io');
    expect(config.databaseAuthToken).toBe('secret');
  });

  it('turns on first-boot seeding only when SEED_IF_EMPTY is "true"', () => {
    expect(loadConfig({ SEED_IF_EMPTY: 'true' }).seedIfEmpty).toBe(true);
    expect(loadConfig({ SEED_IF_EMPTY: 'false' }).seedIfEmpty).toBe(false);
  });

  it('rejects a PORT that is not a number', () => {
    expect(() => loadConfig({ PORT: 'abc' })).toThrow(/PORT/);
  });
});
