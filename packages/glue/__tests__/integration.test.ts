import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventBus } from '@core/services/eventBus';
import { registerEventHandlers } from '../events/handlers';
import { database } from '@core/services/database';
import { backgroundTaskService } from '@modules/termux/service';

describe('Glue integration', () => {
  beforeEach(async () => {
    eventBus.clear();
    vi.clearAllMocks();
    await database.close().catch(() => undefined);
    await database.open();
    registerEventHandlers();
  });

  it('routes a GitHub deep link through navigation', async () => {
    const navigate = vi.fn();
    eventBus.on('navigate', navigate);
    eventBus.emit('deeplink:received', 'https://github.com/user/repo');
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith({ path: '/user/repo', params: {} }));
  });

  it('opens GitHub login externally', async () => {
    const external = vi.fn();
    eventBus.on('browser:open-external', external);
    eventBus.emit('deeplink:received', 'https://github.com/login');
    await vi.waitFor(() => expect(external).toHaveBeenCalledWith('https://github.com/login'));
  });

  it('persists incoming notifications', async () => {
    const dbSpy = vi.spyOn(database, 'execute');
    eventBus.emit('notification:received', { id: 'n1', title: 'Test', body: 'Hello', channelId: 'default_channel_id' });
    await vi.waitFor(() => expect(dbSpy).toHaveBeenCalledWith(expect.stringContaining('INSERT OR REPLACE INTO notifications'), expect.any(Array)));
  });

  it('re-enqueues a failed task through the handler', async () => {
    const enqueue = vi.spyOn(backgroundTaskService, 'enqueue').mockResolvedValue('task_retry');
    eventBus.emit('termux:task-failed', { id: 'x', command: 'echo:retry' });
    await vi.waitFor(() => expect(enqueue).toHaveBeenCalledWith('echo:retry'));
  });

  it('notifies the UI when the database changes', () => {
    const refresh = vi.fn();
    eventBus.on('ui:data-refresh', refresh);
    eventBus.emit('db:changed', { sql: 'SELECT 1' });
    expect(refresh).toHaveBeenCalledWith({ sql: 'SELECT 1' });
  });

  it('signals app readiness after boot handling', async () => {
    const ready = vi.fn();
    eventBus.on('app:ready', ready);
    eventBus.emit('app:boot', {});
    await vi.waitFor(() => expect(ready).toHaveBeenCalledWith({}));
  });
});
