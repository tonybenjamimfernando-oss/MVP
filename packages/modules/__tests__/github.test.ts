import { describe, it, expect, vi, beforeEach } from 'vitest';
import { githubService } from '../github/service';
import { eventBus } from '@core/services/eventBus';
import { database } from '@core/services/database';
import { apiClient } from '@core/services/apiClient';

describe('GitHubService', () => {
  beforeEach(async () => {
    eventBus.clear();
    vi.clearAllMocks();
    apiClient.clearCache();
    await database.close().catch(() => undefined);
    await database.open();
    vi.mocked(fetch).mockImplementation(async () => ({
      ok: true, status: 200, statusText: 'OK',
      json: async () => ({ id: 1, login: 'testuser', avatar_url: 'https://example.test/avatar.png' }),
    } as Response));
  });

  it('generates an OAuth URL containing state and the configured web redirect URI', () => {
    const url = new URL(githubService.getAuthUrl('abc123'));
    expect(url.origin + url.pathname).toBe('https://github.com/login/oauth/authorize');
    expect(url.searchParams.get('client_id')).toBeTruthy();
    expect(url.searchParams.get('state')).toBe('abc123');
    expect(url.searchParams.get('redirect_uri')).toBe('https://tonybenjamimfernando-oss.github.io/MVP/');
  });

  it('resolves a valid github.com deep link', () => {
    expect(githubService.resolveDeepLink('https://github.com/user/repo')).toEqual({
      path: '/user/repo', params: {},
    });
  });

  it('blocks auth deep links and signals external handling', () => {
    const listener = vi.fn();
    eventBus.on('github:external-open', listener);
    expect(githubService.resolveDeepLink('https://github.com/login')).toBeNull();
    expect(listener).toHaveBeenCalledWith('https://github.com/login');
  });

  it('ignores non-GitHub domains', () => {
    expect(githubService.resolveDeepLink('https://example.com/foo')).toBeNull();
  });

  it('emits profile-loaded after loading the profile', async () => {
    const listener = vi.fn();
    eventBus.on('github:profile-loaded', listener);
    await githubService.loadProfile();
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ login: 'testuser' }));
  });
});
