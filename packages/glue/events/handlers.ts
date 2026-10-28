import { eventBus } from '@core/services/eventBus';
import { githubService } from '@modules/github/service';
import { backgroundTaskService } from '@modules/termux/service';
import { database } from '@core/services/database';

/**
 * Handlers de eventos globais
 * Inspirado no LifecycleObserver (AndroidX) + Binder (Termux).
 * Cada handler é uma "ponte" entre módulos independentes.
 */
export function registerEventHandlers(): void {
  // 1. Deep Link do GitHub → resolve e navega
  eventBus.on('deeplink:received', async (url: string) => {
    const resolved = githubService.resolveDeepLink(url);
    if (resolved) {
      eventBus.emit('navigate', resolved);
    } else {
      eventBus.emit('browser:open-external', url);
    }
  });

  // 2. Perfil GitHub carregado → agenda sincronização em background
  eventBus.on('github:profile-loaded', async (user: any) => {
    await backgroundTaskService.enqueue(`echo:Perfil carregado: ${user.login}`);
  });

  // 3. Notificação recebida → persiste e notifica UI
  eventBus.on('notification:received', async (notif: any) => {
    await database.execute(
      `INSERT OR REPLACE INTO notifications (id, title, body, channel_id, timestamp, is_read)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [notif.id, notif.title, notif.body ?? '', notif.channelId ?? 'default_channel_id', Date.now()]
    );
    eventBus.emit('ui:notification-badge-update', { count: 1 });
  });

  // 4. Tarefa Termux falhou → re-agenda (retry policy)
  eventBus.on('termux:task-failed', async ({ id, command }: any) => {
    console.warn(`[Glue] Task ${id} falhou, a reenfileirar: ${command}`);
    await backgroundTaskService.enqueue(command);
  });

  // 5. DB mudou → notifica UI para refresh (inspirado no Room LiveData)
  eventBus.on('db:changed', (payload: any) => {
    eventBus.emit('ui:data-refresh', payload);
  });

  // 6. Boot → retoma tarefas (inspirado no TermuxBootReceiver)
  eventBus.on('app:boot', async () => {
    await database.open();
    await backgroundTaskService.resumeAfterBoot();
    eventBus.emit('app:ready', {});
  });

  console.info('[Glue] Event handlers registados.');
}
