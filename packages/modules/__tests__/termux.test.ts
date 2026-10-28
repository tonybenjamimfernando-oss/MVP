import { describe, it, expect, vi, beforeEach } from 'vitest';
import { backgroundTaskService } from '../termux/service';
import { eventBus } from '@core/services/eventBus';
import { database } from '@core/services/database';

describe('BackgroundTaskService', () => {
  beforeEach(async () => {
    eventBus.clear();
    vi.clearAllMocks();
    await database.close().catch(() => undefined);
    await database.open();
  });

  it('enqueues a task and emits an event', async () => {
    const listener = vi.fn();
    eventBus.on('termux:task-enqueued', listener);
    const id = await backgroundTaskService.enqueue('echo:hello');
    expect(id).toMatch(/^task_/);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ id, command: 'echo:hello' }));
    await vi.waitFor(() => expect(eventBus).toBeDefined());
  });

  it('processes echo tasks and emits completion', async () => {
    const completed = new Promise<any>((resolve) => eventBus.once('termux:task-completed', resolve));
    await backgroundTaskService.enqueue('echo:teste');
    const result = await completed;
    expect(result.output).toBe('teste');
    expect(result.status).toBe('completed');
  });

  it('marks unsupported commands as failed', async () => {
    const failed = new Promise<any>((resolve) => eventBus.once('termux:task-failed', resolve));
    await backgroundTaskService.enqueue('comando_inexistente');
    const result = await failed;
    expect(result.error).toContain('Comando não suportado');
    expect(result.status).toBe('failed');
  });
});
