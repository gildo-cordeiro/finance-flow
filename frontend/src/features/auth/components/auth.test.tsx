import { describe, expect, it } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { request } from '@/services/http';
import { callsTo, json, noContent, problem, session, stubFetch } from '@/test/fetchMock';
import { renderApp } from '@/test/renderApp';

const noSession = () => problem(401, 'INVALID_REFRESH_TOKEN');

async function fillLogin(email: string, password: string) {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText('E-mail'), email);
  await user.type(screen.getByLabelText('Senha'), password);
  await user.click(screen.getByRole('button', { name: 'Entrar' }));
}

describe('sessão', () => {
  it('ao abrir a página, recupera a sessão pelo refresh sem guardar token no navegador', async () => {
    const fetchMock = stubFetch(({ path }) => (path === '/auth/refresh' ? json(200, session()) : noSession()));

    renderApp('/');

    expect(await screen.findByRole('heading', { name: 'Painel' })).toBeInTheDocument();
    expect(screen.getAllByText('Maria Silva').length).toBeGreaterThan(0);
    expect(callsTo(fetchMock, '/auth/refresh')).toHaveLength(1);
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it('rota privada sem sessão vai para o login e volta para a rota original depois de entrar', async () => {
    stubFetch(({ path }) => (path === '/auth/login' ? json(200, session()) : noSession()));

    renderApp('/transacoes');
    expect(await screen.findByRole('heading', { name: 'Entrar no FinanceFlow' })).toBeInTheDocument();

    await fillLogin('maria@exemplo.com', 'senha-forte-1');

    expect(await screen.findByRole('heading', { name: 'Transações' })).toBeInTheDocument();
  });

  it('quando a sessão não pode mais ser renovada, volta para o login', async () => {
    let refreshes = 0;
    stubFetch(({ path }) => {
      if (path === '/auth/refresh') return refreshes++ === 0 ? json(200, session()) : noSession();
      return problem(401, 'UNAUTHORIZED');
    });
    renderApp('/contas');
    expect(await screen.findByRole('heading', { name: 'Contas e cartões' })).toBeInTheDocument();

    await act(() => request('/accounts').catch(() => undefined));

    expect(await screen.findByRole('heading', { name: 'Entrar no FinanceFlow' })).toBeInTheDocument();
  });

  it('sair encerra a sessão no backend e mostra o login', async () => {
    const fetchMock = stubFetch(({ path }) => {
      if (path === '/auth/refresh') return json(200, session());
      if (path === '/auth/logout') return noContent();
      return noSession();
    });
    renderApp('/');

    await userEvent.setup().click((await screen.findAllByRole('button', { name: 'Sair' }))[0]);

    expect(await screen.findByRole('heading', { name: 'Entrar no FinanceFlow' })).toBeInTheDocument();
    expect(callsTo(fetchMock, '/auth/logout')).toHaveLength(1);
  });
});

describe('login', () => {
  it('valida os campos antes de enviar', async () => {
    const fetchMock = stubFetch(noSession);
    renderApp('/entrar');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Entrar' }));
    expect(await screen.findByText('Informe o e-mail')).toBeInTheDocument();
    expect(screen.getByText('Informe a senha')).toBeInTheDocument();

    await user.type(screen.getByLabelText('E-mail'), 'nao-e-email');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByText('E-mail inválido')).toBeInTheDocument();
    expect(callsTo(fetchMock, '/auth/login')).toHaveLength(0);
  });

  it('mostra a mensagem escolhida pelo code do erro', async () => {
    stubFetch(({ path }) => (path === '/auth/login' ? problem(401, 'INVALID_CREDENTIALS') : noSession()));
    renderApp('/entrar');

    await fillLogin('maria@exemplo.com', 'errada-123');

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.');
  });
});

describe('cadastro', () => {
  async function fillRegister(acceptPrivacy = true) {
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('Nome'), 'Maria Silva');
    await user.type(screen.getByLabelText('E-mail'), 'maria@exemplo.com');
    await user.type(screen.getByLabelText('Senha'), 'senhasemnumero');
    if (acceptPrivacy) await user.click(screen.getByRole('checkbox', { name: /política de privacidade/ }));
    await user.click(screen.getByRole('button', { name: 'Criar conta' }));
  }

  it('exige nome, e-mail, senha e o aceite da política de privacidade', async () => {
    const fetchMock = stubFetch(noSession);
    renderApp('/cadastrar');

    await userEvent.setup().click(await screen.findByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByText('Informe seu nome')).toBeInTheDocument();
    expect(screen.getByText('Informe o e-mail')).toBeInTheDocument();
    expect(screen.getByText('A senha precisa ter ao menos 8 caracteres')).toBeInTheDocument();
    expect(screen.getByText('É preciso aceitar a política de privacidade')).toBeInTheDocument();
    expect(callsTo(fetchMock, '/auth/register')).toHaveLength(0);
  });

  it('marca no formulário os campos recusados pela API', async () => {
    stubFetch(({ path }) =>
      path === '/auth/register'
        ? problem(422, 'VALIDATION_FAILED', [{ field: 'password', message: 'A senha precisa ter ao menos um número' }])
        : noSession()
    );
    renderApp('/cadastrar');

    await fillRegister();

    expect(await screen.findByText('A senha precisa ter ao menos um número')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toHaveAttribute('aria-invalid', 'true');
  });

  it('e-mail já cadastrado aparece no campo de e-mail', async () => {
    stubFetch(({ path }) => (path === '/auth/register' ? problem(409, 'EMAIL_ALREADY_USED') : noSession()));
    renderApp('/cadastrar');

    await fillRegister();

    expect(await screen.findByText('Já existe uma conta com este e-mail.')).toBeInTheDocument();
  });

  it('cadastro aceito envia a versão da política e abre o painel', async () => {
    const fetchMock = stubFetch(({ path }) => (path === '/auth/register' ? json(201, session()) : noSession()));
    renderApp('/cadastrar');

    await fillRegister();

    expect(await screen.findByRole('heading', { name: 'Painel' })).toBeInTheDocument();
    const [, init] = callsTo(fetchMock, '/auth/register')[0];
    expect(JSON.parse(String(init?.body))).toEqual({
      name: 'Maria Silva',
      email: 'maria@exemplo.com',
      password: 'senhasemnumero',
      acceptedPrivacyVersion: '2026-10',
    });
    expect(await screen.findByText('Conta criada. Boas-vindas ao FinanceFlow!')).toBeInTheDocument();
  });
});
