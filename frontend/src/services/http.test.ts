import { describe, expect, it, vi } from 'vitest';
import { authHeader, callsTo, json, noContent, problem, session, stubFetch } from '@/test/fetchMock';
import { ApiError, errorMessage } from './errors';
import { REFRESH_LOCK, refreshSession, request, setAccessToken, setSessionExpiredHandler } from './http';

describe('request', () => {
  it('envia o access token, os cookies e o corpo em JSON', async () => {
    const fetchMock = stubFetch(() => json(200, { ok: true }));
    setAccessToken('token-atual');

    await expect(request('/contas', { method: 'POST', body: { nome: 'Conta' } })).resolves.toEqual({ ok: true });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/contas');
    expect(init?.credentials).toBe('include');
    expect(authHeader(init!)).toBe('Bearer token-atual');
    expect(init?.body).toBe('{"nome":"Conta"}');
  });

  it('em 401 renova a sessão uma vez e repete a chamada com o token novo', async () => {
    setAccessToken('vencido');
    const fetchMock = stubFetch(({ path, init }) => {
      if (path === '/auth/refresh') return json(200, session('novo'));
      return authHeader(init) === 'Bearer novo' ? json(200, { ok: true }) : problem(401, 'UNAUTHORIZED');
    });

    await expect(request('/contas')).resolves.toEqual({ ok: true });

    expect(callsTo(fetchMock, '/auth/refresh')).toHaveLength(1);
    expect(callsTo(fetchMock, '/contas')).toHaveLength(2);
  });

  it('chamadas simultâneas com 401 disparam um único refresh', async () => {
    setAccessToken('vencido');
    const fetchMock = stubFetch(async ({ path, init }) => {
      if (path === '/auth/refresh') {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return json(200, session('novo'));
      }
      return authHeader(init) === 'Bearer novo' ? json(200, { path }) : problem(401, 'UNAUTHORIZED');
    });

    const results = await Promise.all([request('/a'), request('/b'), request('/c')]);

    expect(results).toEqual([{ path: '/a' }, { path: '/b' }, { path: '/c' }]);
    expect(callsTo(fetchMock, '/auth/refresh')).toHaveLength(1);
  });

  it('se a renovação falhar, avisa que a sessão expirou e rejeita com o 401', async () => {
    const expired = vi.fn();
    setSessionExpiredHandler(expired);
    stubFetch(({ path }) =>
      path === '/auth/refresh' ? problem(401, 'INVALID_REFRESH_TOKEN') : problem(401, 'UNAUTHORIZED')
    );

    await expect(request('/contas')).rejects.toMatchObject({ status: 401, code: 'UNAUTHORIZED' });
    expect(expired).toHaveBeenCalledOnce();
  });

  it('nas rotas de auth, 401 é devolvido sem tentar renovar', async () => {
    const fetchMock = stubFetch(() => problem(401, 'INVALID_CREDENTIALS'));

    await expect(request('/auth/login', { method: 'POST', authenticated: false })).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
    });
    expect(callsTo(fetchMock, '/auth/refresh')).toHaveLength(0);
  });

  it('converte Problem Details em ApiError com os campos inválidos', async () => {
    stubFetch(() => problem(422, 'VALIDATION_FAILED', [{ field: 'email', message: 'E-mail inválido' }]));

    const error = await request<never>('/auth/register', { authenticated: false }).catch((e: ApiError) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 422, code: 'VALIDATION_FAILED' });
    expect(error.fieldErrors).toEqual([{ field: 'email', message: 'E-mail inválido' }]);
  });

  it('falha de rede vira NETWORK_ERROR', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(request('/contas')).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  });

  it('204 resolve sem corpo', async () => {
    stubFetch(() => noContent());
    await expect(request('/auth/logout', { method: 'POST' })).resolves.toBeUndefined();
  });
});

describe('refreshSession', () => {
  it('devolve null quando não há sessão', async () => {
    stubFetch(() => problem(401, 'INVALID_REFRESH_TOKEN'));
    await expect(refreshSession()).resolves.toBeNull();
  });

  it('renova dentro da trava compartilhada entre abas', async () => {
    const order: string[] = [];
    const request = vi.fn(async (name: string, task: () => Promise<unknown>) => {
      order.push(`trava ${name}`);
      const result = await task();
      order.push('libera');
      return result;
    });
    Object.defineProperty(navigator, 'locks', { value: { request }, configurable: true });
    stubFetch(() => {
      order.push('refresh');
      return json(200, session());
    });

    try {
      await expect(refreshSession()).resolves.toMatchObject({ accessToken: 'access-1' });
      expect(order).toEqual([`trava ${REFRESH_LOCK}`, 'refresh', 'libera']);
    } finally {
      Reflect.deleteProperty(navigator, 'locks');
    }
  });
});

describe('errorMessage', () => {
  it('escolhe a mensagem pelo code e usa o detail para códigos desconhecidos', () => {
    expect(errorMessage(new ApiError(401, 'INVALID_CREDENTIALS', 'x'))).toBe('E-mail ou senha incorretos.');
    expect(errorMessage(new ApiError(409, 'OUTRO_CODIGO', 'Mensagem da API'))).toBe('Mensagem da API');
    expect(errorMessage(new ApiError(503, 'HTTP_503', 'Service Unavailable'))).toMatch(/erro inesperado/);
    expect(errorMessage(new Error('qualquer'))).toMatch(/Não foi possível/);
  });
});
