import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { callsTo, noContent, problem, stubFetch } from '@/test/fetchMock';
import { renderApp } from '@/test/renderApp';

const noSession = () => problem(401, 'INVALID_REFRESH_TOKEN');

describe('esqueci minha senha', () => {
  it('o login leva à página de pedir o link', async () => {
    stubFetch(noSession);
    renderApp('/entrar');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('link', { name: 'Esqueci minha senha' }));

    expect(await screen.findByRole('heading', { name: 'Esqueci minha senha' })).toBeInTheDocument();
  });

  it('confirma o envio sem dizer se o e-mail tem conta', async () => {
    const fetchMock = stubFetch(({ path }) => (path === '/auth/password/forgot' ? noContent() : noSession()));
    renderApp('/esqueci-senha');
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('E-mail'), 'maria@exemplo.com');
    await user.click(screen.getByRole('button', { name: 'Enviar link' }));

    expect(await screen.findByRole('heading', { name: 'Confira seu e-mail' })).toBeInTheDocument();
    expect(screen.getByText(/maria@exemplo.com/)).toBeInTheDocument();
    const [, init] = callsTo(fetchMock, '/auth/password/forgot')[0];
    expect(JSON.parse(String(init?.body))).toEqual({ email: 'maria@exemplo.com' });

    await user.click(screen.getByRole('button', { name: 'Enviar outro link' }));
    expect(callsTo(fetchMock, '/auth/password/forgot')).toHaveLength(2);
  });

  it('valida o e-mail antes de enviar', async () => {
    const fetchMock = stubFetch(noSession);
    renderApp('/esqueci-senha');
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('E-mail'), 'maria');
    await user.click(screen.getByRole('button', { name: 'Enviar link' }));

    expect(await screen.findByText('E-mail inválido')).toBeInTheDocument();
    expect(callsTo(fetchMock, '/auth/password/forgot')).toHaveLength(0);
  });

  it('mostra o limite de pedidos', async () => {
    stubFetch(({ path }) => (path === '/auth/password/forgot' ? problem(429, 'TOO_MANY_REQUESTS') : noSession()));
    renderApp('/esqueci-senha');
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('E-mail'), 'maria@exemplo.com');
    await user.click(screen.getByRole('button', { name: 'Enviar link' }));

    expect(await screen.findByText(/Muitas tentativas seguidas/)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Confira seu e-mail' })).not.toBeInTheDocument();
  });
});

describe('redefinir senha', () => {
  async function fillNewPassword(password: string, confirmation = password) {
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('Senha nova'), password);
    await user.type(screen.getByLabelText('Repita a senha'), confirmation);
    await user.click(screen.getByRole('button', { name: 'Salvar senha' }));
    return user;
  }

  it('salva a senha nova com o token do link e volta para o login', async () => {
    const fetchMock = stubFetch(({ path }) => (path === '/auth/password/reset' ? noContent() : noSession()));
    renderApp('/redefinir-senha?token=abc123');

    await fillNewPassword('senha-nova-1');

    expect(await screen.findByRole('heading', { name: 'Entrar no FinanceFlow' })).toBeInTheDocument();
    const [, init] = callsTo(fetchMock, '/auth/password/reset')[0];
    expect(JSON.parse(String(init?.body))).toEqual({ token: 'abc123', newPassword: 'senha-nova-1' });
  });

  it('não envia quando as senhas não são iguais', async () => {
    const fetchMock = stubFetch(noSession);
    renderApp('/redefinir-senha?token=abc123');

    await fillNewPassword('senha-nova-1', 'senha-nova-2');

    expect(await screen.findByText('As senhas não são iguais')).toBeInTheDocument();
    expect(callsTo(fetchMock, '/auth/password/reset')).toHaveLength(0);
  });

  it('link vencido ou usado oferece pedir outro', async () => {
    stubFetch(({ path }) => (path === '/auth/password/reset' ? problem(422, 'INVALID_RESET_TOKEN') : noSession()));
    renderApp('/redefinir-senha?token=velho');

    await fillNewPassword('senha-nova-1');

    expect(await screen.findByRole('heading', { name: 'Este link não vale mais' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pedir outro link' })).toHaveAttribute('href', '/esqueci-senha');
  });

  it('sem token no endereço mostra o link inválido', async () => {
    stubFetch(noSession);
    renderApp('/redefinir-senha');

    expect(await screen.findByRole('heading', { name: 'Este link não vale mais' })).toBeInTheDocument();
  });
});
