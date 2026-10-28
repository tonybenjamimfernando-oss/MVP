import { describe, it, expect, vi, beforeEach } from 'vitest';
import { database } from '../database';
import { eventBus } from '../eventBus';

describe('DatabaseService', () => {
  beforeEach(async () => {
    eventBus.clear();
    await database.close().catch(() => undefined);
    await database.open();
  });

  it('opens the database and runs migrations', async () => {
    expect(database).toBeDefined();
  });

  it('returns an array from a query', async () => {
    const result = await database.query('SELECT * FROM users');
    expect(Array.isArray(result)).toBe(true);
  });

  it('emits db:changed after execute', async () => {
    const listener = vi.fn();
    eventBus.on('db:changed', listener);
    await database.execute('INSERT INTO users (id, username) VALUES (?, ?)', ['1', 'test']);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
      sql: expect.stringContaining('INSERT INTO users'),
      params: ['1', 'test'],
    }));
  });
});
