import { apiClient } from '@core/services/apiClient';
import { database } from '@core/services/database';
import { eventBus } from '@core/services/eventBus';

const GITHUB_API = 'https://api.github.com';
const GITHUB_OAUTH = 'https://github.com/login/oauth/authorize';
const OAUTH_PROXY = 'https://cdauhpfszqhlojcafulo.supabase.co/functions/v1/github-oauth-proxy';
const SUPABASE_PUBLIC_KEY = 'sb_publishable_VjW2Xo-nVaXUQuE-1bWFKg_wpCLrG1q';
const CLIENT_ID = 'Ov23liwHOftIz628lfTX';
const REDIRECT_URI = 'https://tonybenjamimfernando-oss.github.io/MVP/';

export interface GitHubDeviceFlow {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  interval: number;
  expiresIn: number;
}

class GitHubService {
  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: 'repo notifications user',
      state,
    });
    return `${GITHUB_OAUTH}?${params.toString()}`;
  }

  /** Inicia o Device Flow através de uma Edge Function para evitar CORS no browser. */
  async startDeviceFlow(): Promise<GitHubDeviceFlow> {
    let res: Response;
    try {
      res = await fetch(OAUTH_PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', apikey: SUPABASE_PUBLIC_KEY },
        body: JSON.stringify({ action: 'device-code' }),
      });
    } catch {
      throw new Error('Não foi possível contactar o serviço seguro de autenticação. Verifica a ligação e tenta novamente.');
    }
    let data: any;
    try { data = await res.json(); } catch {
      throw new Error('O serviço de autenticação devolveu uma resposta inválida.');
    }
    if (!res.ok || !data.device_code || !data.user_code || !data.verification_uri) {
      throw new Error(data.error_description || data.error || 'O GitHub não iniciou a autorização. Confirma se o Device Flow está ativado na OAuth App.');
    }
    return {
      deviceCode: data.device_code,
      userCode: data.user_code,
      verificationUri: data.verification_uri,
      interval: Math.max(Number(data.interval) || 5, 5),
      expiresIn: Math.max(Number(data.expires_in) || 900, 60),
    };
  }

  /** Aguarda autorização no GitHub e guarda o token apenas em memória no cliente API. */
  async pollDeviceFlow(deviceCode: string, interval: number, expiresIn: number): Promise<string> {
    const deadline = Date.now() + expiresIn * 1000;
    while (Date.now() < deadline) {
      await new Promise((resolve) => window.setTimeout(resolve, interval * 1000));
      let res: Response;
      try {
        res = await fetch(OAUTH_PROXY, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json', apikey: SUPABASE_PUBLIC_KEY },
          body: JSON.stringify({ action: 'access-token', device_code: deviceCode }),
        });
      } catch {
        throw new Error('A ligação ao serviço de autenticação falhou. Tenta novamente.');
      }
      let data: any;
      try { data = await res.json(); } catch {
        throw new Error('O serviço de autenticação devolveu uma resposta inválida.');
      }
      if (data.access_token) {
        apiClient.setAuthToken(data.access_token);
        return data.access_token;
      }
      if (data.error === 'authorization_pending') continue;
      if (data.error === 'slow_down') { interval += 5; continue; }
      if (data.error === 'expired_token') throw new Error('O código de autorização expirou. Inicia novamente.');
      if (data.error === 'access_denied') throw new Error('A autorização foi recusada no GitHub.');
      throw new Error(data.error_description || data.error || 'Não foi possível concluir a autenticação GitHub.');
    }
    throw new Error('O pedido expirou. Inicia novamente e autoriza dentro do prazo.');
  }

  /** A troca do OAuth de redirecionamento não deve ser feita diretamente no browser. */
  async exchangeCodeForToken(_code: string): Promise<string> {
    throw new Error('Este cliente usa o Device Flow seguro. Inicia sessão pelo botão Entrar com GitHub.');
  }

  async loadProfile(): Promise<void> {
    apiClient.configure(GITHUB_API);
    const user = await apiClient.request<any>('/user', { useCache: false });
    await database.execute(
      `INSERT OR REPLACE INTO users (id, username, avatar_url, auth_token, biometric_locked)
       VALUES (?, ?, ?, ?, 0)`,
      [user.id.toString(), user.login, user.avatar_url, null]
    );
    eventBus.emit('github:profile-loaded', user);
  }

  async listRepos(): Promise<any[]> {
    apiClient.configure(GITHUB_API);
    const repos = await apiClient.request<any[]>('/user/repos?per_page=50', { useCache: true });
    eventBus.emit('github:repos-loaded', repos);
    return repos;
  }

  async listNotifications(): Promise<any[]> {
    apiClient.configure(GITHUB_API);
    return apiClient.request<any[]>('/notifications', { useCache: true });
  }

  resolveDeepLink(url: string): { path: string; params: Record<string, string> } | null {
    try {
      const u = new URL(url);
      if (u.hostname !== 'github.com' && !u.hostname.endsWith('.ghe.com')) return null;
      const blocked = ['/login', '/signup', '/session', '/sessions', '/logout', '/auth'];
      if (blocked.some((b) => u.pathname.startsWith(b))) {
        eventBus.emit('github:external-open', url);
        return null;
      }
      const parts = u.pathname.split('/').filter(Boolean);
      return { path: '/' + parts.join('/'), params: Object.fromEntries(u.searchParams) };
    } catch { return null; }
  }
}

export const githubService = new GitHubService();
