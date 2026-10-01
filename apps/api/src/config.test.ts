import { describe, expect, it } from 'vitest';
import { loadConfig } from './config';

describe('loadConfig', () => {
  it('applies defaults when optional variables are missing', () => {
    expect(loadConfig({})).toEqual({ port: 3000, corsOrigin: '*', version: '0.1.0' });
  });

  it('reads PORT and CORS_ORIGIN from the environment', () => {
    const config = loadConfig({ PORT: '8080', CORS_ORIGIN: 'https://acme.example' });

    expect(config.port).toBe(8080);
    expect(config.corsOrigin).toBe('https://acme.example');
  });

  it('rejects a PORT that is not a number', () => {
    expect(() => loadConfig({ PORT: 'abc' })).toThrow(/PORT/);
  });
});
