import { eventBus } from './eventBus';

/**
 * ApiClient
 * Inspirado no OkHttp (GitHub) + WebApkServiceImplWrapper (Chromium).
 * - Retry exponencial para erros 5xx e network
 * - Cache em memória (LRU simples)
 * - Auth Bearer token injectável
 * - Emite `api:error` e `api:success` para observabilidade
 */
interface RequestOptions extends RequestInit {
  retries?: number;
  timeoutMs?: number;
  useCache?: boolean;
}

class ApiClient {
  private baseUrl: string = '';
  private authToken: string | null = null;
  private cache: Map<string, { data: any; expiresAt: number }> = new Map();
  private readonly CACHE_TTL_MS = 60_000;
  private readonly MAX_RETRIES = 3;

  configure(baseUrl: string, token?: string): void {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    if (token) this.authToken = token;
  }

  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  async request<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
    const {
      retries = this.MAX_RETRIES,
      timeoutMs = 15_000,
      useCache = false,
      ...fetchOpts
    } = options;

    const url = `${this.baseUrl}${path}`;
    const cacheKey = `${fetchOpts.method ?? 'GET'}:${url}`;

    // Cache (inspirado no OkHttp Cache)
    if (useCache && this.cache.has(cacheKey)) {
      const entry = this.cache.get(cacheKey)!;
      if (Date.now() < entry.expiresAt) return entry.data;
      this.cache.delete(cacheKey);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((fetchOpts.headers as Record<string, string>) ?? {}),
    };
    if (this.authToken) headers['Authorization'] = `Bearer ${this.authToken}`;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(url, {
          ...fetchOpts,
          headers,
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (!response.ok) {
          if (response.status >= 500 && attempt < retries) {
            await this.backoff(attempt);
            continue;
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = (await response.json()) as T;

        if (useCache) {
          this.cache.set(cacheKey, { data, expiresAt: Date.now() + this.CACHE_TTL_MS });
        }

        eventBus.emit('api:success', { url, status: response.status });
        return data;
      } catch (err: any) {
        lastError = err;
        if (attempt < retries) {
          await this.backoff(attempt);
          continue;
        }
        eventBus.emit('api:error', { url, error: err.message });
        throw err;
      }
    }

    throw lastError ?? new Error('Erro desconhecido');
  }

  private backoff(attempt: number): Promise<void> {
    const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
    return new Promise((r) => setTimeout(r, delay));
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const apiClient = new ApiClient();
