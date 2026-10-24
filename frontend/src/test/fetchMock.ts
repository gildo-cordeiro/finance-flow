import { vi } from 'vitest';

type Handler = (call: { method: string; path: string; init: RequestInit }) => Response | Promise<Response>;

/** Substitui o `fetch` global; `path` vem sem o prefixo `/api/v1`. */
export function stubFetch(handler: Handler) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) =>
    handler({ method: init.method ?? 'GET', path: String(input).replace(/^\/api\/v1/, ''), init })
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export function noContent() {
  return new Response(null, { status: 204 });
}

export function problem(status: number, code: string, errors?: { field: string; message: string }[]) {
  return json(status, { status, code, detail: `detalhe de ${code}`, errors });
}

export function authHeader(init: RequestInit) {
  return (init.headers as Record<string, string> | undefined)?.Authorization;
}

export const session = (accessToken = 'access-1') => ({
  accessToken,
  expiresIn: 900,
  user: { id: 'u-1', name: 'Maria Silva', email: 'maria@exemplo.com' },
});

/** Chamadas feitas a um caminho, para contar refresh, login etc. */
export function callsTo(fetchMock: ReturnType<typeof stubFetch>, path: string) {
  return fetchMock.mock.calls.filter(([input]) => String(input) === `/api/v1${path}`);
}
