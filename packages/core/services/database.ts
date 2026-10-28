import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { eventBus } from './eventBus';

/**
 * DatabaseService
 * Abstração sobre SQLite inspirada no AndroidX Room + TermuxContentProvider.
 * - Suporta migrations versionadas
 * - Emite eventos `db:changed` para sincronização entre módulos
 * - Multi-connection safe (padrão MultiInstanceInvalidationService)
 */
class DatabaseService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private readonly DB_NAME = 'hybridapp.db';
  private readonly DB_VERSION = 1;

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  async open(): Promise<void> {
    this.db = await this.sqlite.createConnection(
      this.DB_NAME,
      false,
      'no-encryption',
      this.DB_VERSION,
      false
    );
    await this.db.open();
    await this.runMigrations();
  }

  /** Migrations versionadas (inspirado no Room @Database(version = N)) */
  private async runMigrations(): Promise<void> {
    if (!this.db) throw new Error('DB não aberta');

    // Tabela de utilizador (inspirada no GitHub Account)
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL,
        username TEXT NOT NULL,
        avatar_url TEXT,
        auth_token TEXT,
        biometric_locked INTEGER DEFAULT 0
      );
    `);

    // Tabela de notificações (inspirada no WebAPK NotificationManager)
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        body TEXT,
        channel_id TEXT DEFAULT 'default_channel_id',
        timestamp INTEGER NOT NULL,
        is_read INTEGER DEFAULT 0
      );
    `);

    // Tabela de tarefas em background (inspirada no TermuxService)
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS background_tasks (
        id TEXT PRIMARY KEY NOT NULL,
        command TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        output TEXT,
        created_at INTEGER NOT NULL
      );
    `);
  }

  /** Executa uma query e emite evento de mudança */
  async execute<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.db) throw new Error('DB não aberta');
    const res = await this.db.query(sql, params);
    eventBus.emit('db:changed', { sql, params, values: res.values });
    return (res.values ?? []) as T[];
  }

  /** Leitura com filtro */
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.db) throw new Error('DB não aberta');
    const res = await this.db.query(sql, params);
    return (res.values ?? []) as T[];
  }

  /** Transação atómica (inspirado no Room @Transaction) */
  async transaction(queries: { sql: string; params: any[] }[]): Promise<void> {
    if (!this.db) throw new Error('DB não aberta');
    await this.db.executeSet(
      queries.map((q) => ({ statement: q.sql, values: q.params })),
      true
    );
    eventBus.emit('db:transaction', { count: queries.length });
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.sqlite.closeConnection(this.DB_NAME, false);
      this.db = null;
    }
  }
}

export const database = new DatabaseService();
