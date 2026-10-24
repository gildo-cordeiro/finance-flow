import { ApiError, toApiError } from './errors';

const BASE_URL = '/api/v1';

// ADR-0026: o access token vive só em memória; o refresh token fica no cookie HttpOnly
let accessToken: string | null = null;
let refreshing: Promise<{ accessToken: string } | null> | null = null;
let sessionExpiredHandler: (() => void) | null = null;

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  method?: Method;
  body?: unknown;
  /** `false` nas rotas de `/auth`: um 401 ali é a resposta, não sessão vencida. */
  authenticated?: boolean;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

/** Chamado quando a sessão não pode mais ser renovada. */
export function setSessionExpiredHandler(handler: (() => void) | null) {
  sessionExpiredHandler = handler;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response = await send(path, options);
  if (response.status === 401 && options.authenticated !== false) {
    const session = await refreshSession();
    if (session) response = await send(path, options);
    if (!session || response.status === 401) sessionExpiredHandler?.();
  }
  return parse<T>(response);
}

/**
 * Renova o access token pelo cookie. Chamadas simultâneas compartilham um único refresh, porque
 * reapresentar um refresh token já rotacionado revoga todas as sessões (ADR-0005).
 */
export function refreshSession<T extends { accessToken: string }>(): Promise<T | null> {
  refreshing ??= doRefresh().finally(() => {
    refreshing = null;
  });
  return refreshing as Promise<T | null>;
}

async function doRefresh(): Promise<{ accessToken: string } | null> {
  try {
    const response = await send('/auth/refresh', { method: 'POST', authenticated: false });
    const session = await parse<{ accessToken: string }>(response);
    accessToken = session.accessToken;
    return session;
  } catch {
    accessToken = null;
    return null;
  }
}

async function send(path: string, { method = 'GET', body, authenticated = true }: RequestOptions) {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (authenticated && accessToken) headers.Authorization = `Bearer ${accessToken}`;
  try {
    return await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Sem conexão com o servidor');
  }
}

async function parse<T>(response: Response): Promise<T> {
  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
