import type { Express } from 'express';
import { createApp } from '../app';
import type { Db } from '../db/client';
import { createTestDb } from './test-db';

export const TEST_NOW = new Date('2026-10-01T09:00:00.000Z');

export async function createTestApp(): Promise<{ app: Express; db: Db }> {
  const db = await createTestDb();
  const app = createApp({ corsOrigin: '*', version: 'test', db, clock: () => TEST_NOW });
  return { app, db };
}
