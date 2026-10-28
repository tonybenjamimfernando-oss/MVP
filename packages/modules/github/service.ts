import { apiClient } from '@core/services/apiClient';
import { database } from '@core/services/database';
import { eventBus } from '@core/services/eventBus';

const GITHUB_API = 'https://api.github.com';
const GITHUB_OAUTH = 'https://github.com/login/oauth/authorize';
const CLIENT_ID = 'Ov23liwHOftIz628lfTX'; // Configurar via env
const REDIRECT_URI = 'https://tonybenjamimfernando-oss.github.io/MVP/';

/**
 * GitHubService
 * Inspirado no GitHub Android (AppAuth + Deep Links cirúrgicos).
 * - OAuth flow com deep link `https://tonybenjamimfernando-oss.github.io/MVP/`
 * - Cache de repos e notificações
 * - Persistência de utilizador na DB local
 */
class GitHubService {
  /** Gera URL de autorização (inspirado no RedirectUriReceiverActivity) */
  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: 'repo notifications user',
      state,
    });
    return `${GITHUB_OAUTH}?${params.toString()}`;
  }

  /** Troca o código OAuth por token (via backend seguro ou device flow) */
  async exchangeCodeForToken(code: string): Promise<string> {
    // Nota: em produção, isto deve ser feito no backend para não expor o client_secret
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: CLIENT_ID, code }),
    });
    const data = await res.json();
    if (!data.access_token) throw new Error('Falha na troca de token');
    apiClient.setAuthToken(data.access_token);
    return data.access_token;
  }

  /** Carrega o perfil do utilizador e persiste localmente */
  async loadProfile(): Promise<void> {
    apiClient.configure(GITHUB_API);
    const user = await apiClient.request<any>('/user', { useCache: true });

    await database.execute(
      `INSERT OR REPLACE INTO users (id, username, avatar_url, auth_token, biometric_locked)
       VALUES (?, ?, ?, ?, 0)`,
      [user.id.toString(), user.login, user.avatar_url, null]
    );

    eventBus.emit('github:profile-loaded', user);
  }

  /** Lista repositórios do utilizador */
  async listRepos(): Promise<any[]> {
    apiClient.configure(GITHUB_API);
    const repos = await apiClient.request<any[]>('/user/repos?per_page=50', {
      useCache: true,
    });
    eventBus.emit('github:repos-loaded', repos);
    return repos;
  }

  /** Lista notificações (inspirado no PushNotificationsService) */
  async listNotifications(): Promise<any[]> {
    apiClient.configure(GITHUB_API);
    return apiClient.request<any[]>('/notifications', { useCache: true });
  }

  /** Resolve um deep link do GitHub (inspirado no uri-relative-filter-group) */
  resolveDeepLink(url: string): { path: string; params: Record<string, string> } | null {
    try {
      const u = new URL(url);
      if (u.hostname !== 'github.com' && !u.hostname.endsWith('.ghe.com')) return null;

      // Bloquear rotas de auth (devem abrir no browser)
      const blocked = ['/login', '/signup', '/session', '/sessions', '/logout', '/auth'];
      if (blocked.some((b) => u.pathname.startsWith(b))) {
        eventBus.emit('github:external-open', url);
        return null;
      }

      const parts = u.pathname.split('/').filter(Boolean);
      return { path: '/' + parts.join('/'), params: Object.fromEntries(u.searchParams) };
    } catch {
      return null;
    }
  }
}

export const githubService = new GitHubService();
