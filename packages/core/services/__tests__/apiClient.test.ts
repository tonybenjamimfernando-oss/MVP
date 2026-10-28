import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient } from '../apiClient';
import { eventBus } from '../eventBus';

describe('ApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    eventBus.clear();
    apiClient.clearCache();
    apiClient.configure('https://api.test.com');
    vi.mocked(fetch).mockImplementation(async () => ({
      ok: true, status: 200, statusText: 'OK',
      json: async () => ({ id: 1, login: 'testuser' }),
    } as Response));
  });
  afterEach(() => { vi.useRealTimers(); });

  it('makes a successful request', async () => {
    const data = await apiClient.request('/user');
    expect(data).toHaveProperty('login', 'testuser');
    expect(fetch).toHaveBeenCalledWith('https://api.test.com/user', expect.objectContaining({ headers: expect.any(Object) }));
  });

  it('uses cache when useCache=true', async () => {
    const first = await apiClient.request('/user', { useCache: true });
    const second = await apiClient.request('/user', { useCache: true });
    expect(first).toEqual(second);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('retries server errors and eventually succeeds', async () => {
    vi.useFakeTimers();
    let calls = 0;
    vi.mocked(fetch).mockImplementation(async () => {
      calls += 1;
      if (calls < 3) return { ok: false, status: 500, statusText: 'Error' } as Response;
      return { ok: true, status: 200, statusText: 'OK', json: async () => ({ ok: true }) } as Response;
    });
    const pending = apiClient.request('/retry', { retries: 2 });
    await vi.runAllTimersAsync();
    await expect(pending).resolves.toEqual({ ok: true });
    expect(calls).toBe(3);
  });

  it('emits api:error on a final failure', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 400, statusText: 'Bad Request' } as Response);
    const listener = vi.fn();
    eventBus.on('api:error', listener);
    await expect(apiClient.request('/fail', { retries: 0 })).rejects.toThrow('HTTP 400');
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://api.test.com/fail' }));
  });
});
