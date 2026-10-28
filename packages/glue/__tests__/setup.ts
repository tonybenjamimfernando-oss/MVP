import { vi } from 'vitest';

vi.mock('@capacitor-community/sqlite', () => {
  const connection = {
    open: vi.fn().mockResolvedValue(undefined),
    execute: vi.fn().mockResolvedValue({ changes: { changes: 1 } }),
    query: vi.fn().mockResolvedValue({ values: [] }),
    executeSet: vi.fn().mockResolvedValue(undefined),
  };
  return {
    CapacitorSQLite: {},
    SQLiteConnection: class {
      async createConnection() { return connection; }
      async closeConnection() { return undefined; }
    },
  };
});

vi.mock('capacitor-foreground-service', () => ({
  CapacitorForegroundService: {
    startService: vi.fn().mockResolvedValue(undefined),
    stopService: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@aparajita/capacitor-biometric-auth', () => ({
  BiometricAuth: {
    authenticate: vi.fn().mockResolvedValue({}),
    checkBiometry: vi.fn().mockResolvedValue({ isAvailable: true }),
  },
}));

vi.mock('@capacitor/app', () => ({
  App: { addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }) },
}));

vi.mock('@capacitor/push-notifications', () => ({
  PushNotifications: {
    requestPermissions: vi.fn().mockResolvedValue({ receive: 'granted' }),
    register: vi.fn().mockResolvedValue(undefined),
    addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
  },
}));

const defaultFetchResponse = () => ({
  ok: true,
  status: 200,
  statusText: 'OK',
  json: async () => ({ id: 1, login: 'testuser', avatar_url: 'https://example.test/avatar.png', name: 'Test Repo', owner: { login: 'testuser' } }),
});

vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => defaultFetchResponse()));
