import { database } from '@core/services/database';
import { eventBus } from '@core/services/eventBus';

interface Task {
  id: string;
  command: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

/**
 * TermuxService
 * Inspirado no TermuxService + JobSchedulerAPI.
 * - Foreground service com notificação persistente
 * - Fila de tarefas com retry
 * - Persistência do estado na DB
 */
class BackgroundTaskService {
  private running = false;
  private queue: Task[] = [];
  private readonly NOTIFICATION_ID = 1001;

  /** Inicia o foreground service (inspirado no TermuxService.onCreate) */
  async startForeground(): Promise<void> {
      notificationId: this.NOTIFICATION_ID,
      title: 'HybridApp',
      description: 'Serviço em execução',
      importance: 1,
    });
    eventBus.emit('termux:service-started', { id: this.NOTIFICATION_ID });
  }

  async stopForeground(): Promise<void> {
    eventBus.emit('termux:service-stopped', {});
  }

  /** Enfileira uma tarefa (inspirado no JobScheduler) */
  async enqueue(command: string): Promise<string> {
    const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const task: Task = { id, command, status: 'pending' };

    await database.execute(
      `INSERT INTO background_tasks (id, command, status, created_at)
       VALUES (?, ?, 'pending', ?)`,
      [id, command, Date.now()]
    );

    this.queue.push(task);
    eventBus.emit('termux:task-enqueued', task);

    if (!this.running) void this.processQueue();
    return id;
  }

  private async processQueue(): Promise<void> {
    this.running = true;
    if (this.queue.length > 0) await this.startForeground();

    while (this.queue.length > 0) {
      const task = this.queue.shift()!;
      task.status = 'running';
      eventBus.emit('termux:task-started', task);

      try {
        const output = await this.execute(task.command);
        task.status = 'completed';
        await database.execute(
          `UPDATE background_tasks SET status = 'completed', output = ? WHERE id = ?`,
          [output, task.id]
        );
        eventBus.emit('termux:task-completed', { ...task, output });
      } catch (err: any) {
        task.status = 'failed';
        await database.execute(
          `UPDATE background_tasks SET status = 'failed', output = ? WHERE id = ?`,
          [err.message, task.id]
        );
        eventBus.emit('termux:task-failed', { ...task, error: err.message });
      }
    }

    await this.stopForeground();
    this.running = false;
  }

  /** Stub: no Android nativo isto seria um shell command via libtermux */
  private async execute(command: string): Promise<string> {
    if (command.startsWith('sleep:')) {
      const ms = parseInt(command.split(':')[1], 10);
      await new Promise((r) => setTimeout(r, ms));
      return `Dormiu ${ms}ms`;
    }
    if (command.startsWith('echo:')) return command.slice(5);
    throw new Error(`Comando não suportado: ${command}`);
  }

  /** Reinicia tarefas pendentes após boot (inspirado no TermuxBootReceiver) */
  async resumeAfterBoot(): Promise<void> {
    const pending = await database.query<any>(
      `SELECT * FROM background_tasks WHERE status IN ('pending', 'running')`
    );
    for (const t of pending) this.queue.push({ id: t.id, command: t.command, status: 'pending' });
    if (this.queue.length > 0) void this.processQueue();
    eventBus.emit('termux:boot-resumed', { count: pending.length });
  }
}

export const backgroundTaskService = new BackgroundTaskService();
