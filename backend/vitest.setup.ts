import { beforeAll, afterAll } from 'vitest';
import { closeConnections } from './src/db/client';

beforeAll(() => {
  process.env.DB_DIALECT = 'sqlite';
  process.env.DB_PATH = ':memory:';
});

afterAll(async () => {
  await closeConnections();
});
