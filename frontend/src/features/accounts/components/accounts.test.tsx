import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { json, noContent, problem, session, stubFetch } from '@/test/fetchMock';
import { renderApp } from '@/test/renderApp';
import type { Account } from '../types';

const corrente: Account = {
  id: 'a-1',
  name: 'Conta do dia a dia',
  type: 'CHECKING',
  bank: 'Nubank',
  initialBalance: 1000,
  competenceOffset: 0,
  archived: false,
  balance: 1234.5,
};
const antiga: Account = { ...corrente, id: 'a-2', name: 'Conta antiga', bank: null, archived: true, balance: 0 };

type Call = { method: string; path: string; init: RequestInit };

function stubAccountsApi(onWrite: (call: Call) => Response = () => problem(500, 'INTERNAL_ERROR')) {
  return stubFetch((call) => {
    if (call.path === '/auth/refresh') return json(200, session());
    if (call.path === '/accounts/summary') return json(200, { balance: 1234.5, accountCount: 1 });
    if (call.path === '/accounts?includeArchived=false') return json(200, [corrente]);
    if (call.path === '/accounts?includeArchived=true') return json(200, [antiga, corrente]);
    if (call.path.startsWith('/accounts')) return onWrite(call);
    return problem(404, 'NOT_FOUND');
  });
}

function writes(fetchMock: ReturnType<typeof stubFetch>) {
  return fetchMock.mock.calls
    .map(([input, init]) => ({ path: String(input).replace(/^\/api\/v1/, ''), method: init?.method ?? 'GET', init }))
    .filter(({ method }) => method !== 'GET' && method !== undefined)
    .filter(({ path }) => path.startsWith('/accounts'));
}

describe('contas', () => {
  it('lista as contas ativas com o saldo calculado', async () => {
    stubAccountsApi();
    renderApp('/contas');

    expect(await screen.findByText('Conta do dia a dia')).toBeInTheDocument();
    expect(screen.getByText('Conta corrente · Nubank')).toBeInTheDocument();
    expect(screen.getByLabelText('Saldo de Conta do dia a dia')).toHaveTextContent('R$ 1.234,50');
    expect(screen.queryByText('Conta antiga')).not.toBeInTheDocument();
  });

  it('mostra no topo o saldo total calculado pela API', async () => {
    stubAccountsApi();
    renderApp('/contas');

    expect(await screen.findByLabelText('Saldo em contas')).toHaveTextContent('R$ 1.234,50');
    expect(screen.getByText('Hoje, em 1 conta ativa')).toBeInTheDocument();
  });

  it('mostra as arquivadas quando pedido', async () => {
    stubAccountsApi();
    renderApp('/contas');
    const user = userEvent.setup();

    await screen.findByText('Conta do dia a dia');
    await user.click(screen.getByLabelText('Mostrar arquivadas'));

    expect(await screen.findByText('Conta antiga')).toBeInTheDocument();
    expect(screen.getByText('(arquivada)')).toBeInTheDocument();
  });

  it('cria uma conta convertendo o saldo inicial', async () => {
    const fetchMock = stubAccountsApi(({ init }) => json(201, { ...corrente, ...JSON.parse(String(init.body)), id: 'a-3' }));
    renderApp('/contas');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Nova conta' }));
    const sheet = await screen.findByRole('dialog');
    await user.type(within(sheet).getByLabelText('Nome'), 'Reserva');
    await user.selectOptions(within(sheet).getByLabelText('Tipo'), 'SAVINGS');
    const balance = within(sheet).getByLabelText('Saldo inicial (R$)');
    await user.clear(balance);
    await user.type(balance, '-150,75');
    await user.click(within(sheet).getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByText('Conta criada.')).toBeInTheDocument();
    const [post] = writes(fetchMock);
    expect(post.method).toBe('POST');
    expect(JSON.parse(String(post.init?.body))).toEqual({
      name: 'Reserva',
      type: 'SAVINGS',
      bank: null,
      initialBalance: -150.75,
      competenceOffset: 0,
    });
  });

  it('valida o formulário antes de enviar', async () => {
    const fetchMock = stubAccountsApi();
    renderApp('/contas');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Nova conta' }));
    const sheet = await screen.findByRole('dialog');
    await user.clear(within(sheet).getByLabelText('Saldo inicial (R$)'));
    await user.type(within(sheet).getByLabelText('Saldo inicial (R$)'), 'abc');
    await user.click(within(sheet).getByRole('button', { name: 'Criar conta' }));

    expect(await within(sheet).findByText('Informe o nome da conta')).toBeInTheDocument();
    expect(within(sheet).getByText('Informe um valor como 1500,00')).toBeInTheDocument();
    expect(writes(fetchMock)).toHaveLength(0);
  });

  it('edita a conta com os valores atuais preenchidos', async () => {
    const fetchMock = stubAccountsApi(({ init }) => json(200, { ...corrente, ...JSON.parse(String(init.body)) }));
    renderApp('/contas');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Editar Conta do dia a dia' }));
    const sheet = await screen.findByRole('dialog');
    expect(within(sheet).getByLabelText('Saldo inicial (R$)')).toHaveValue('1000,00');
    await user.clear(within(sheet).getByLabelText('Banco (opcional)'));
    await user.click(within(sheet).getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByText('Conta atualizada.')).toBeInTheDocument();
    const [put] = writes(fetchMock);
    expect(put).toMatchObject({ method: 'PUT', path: '/accounts/a-1' });
    expect(JSON.parse(String(put.init?.body))).toMatchObject({ bank: null, initialBalance: 1000 });
  });

  it('arquiva a conta', async () => {
    const fetchMock = stubAccountsApi(() => json(200, { ...corrente, archived: true }));
    renderApp('/contas');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Arquivar Conta do dia a dia' }));

    expect(await screen.findByText('Conta arquivada.')).toBeInTheDocument();
    expect(writes(fetchMock)).toMatchObject([{ method: 'POST', path: '/accounts/a-1/archive' }]);
  });

  it('pede confirmação para excluir e explica quando a conta tem transações', async () => {
    const fetchMock = stubAccountsApi(() => problem(409, 'ACCOUNT_IN_USE'));
    renderApp('/contas');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Excluir Conta do dia a dia' }));
    expect(writes(fetchMock)).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: 'Confirmar exclusão' }));

    expect(
      await screen.findByText('Esta conta tem transações e não pode ser excluída. Arquive-a para escondê-la.')
    ).toBeInTheDocument();
    expect(writes(fetchMock)).toMatchObject([{ method: 'DELETE', path: '/accounts/a-1' }]);
  });

  it('exclui a conta sem transações', async () => {
    stubAccountsApi(() => noContent());
    renderApp('/contas');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Excluir Conta do dia a dia' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar exclusão' }));

    await waitFor(() => expect(screen.getByText('Conta excluída.')).toBeInTheDocument());
  });

  it('mostra um estado vazio sem contas', async () => {
    stubFetch(({ path }) => {
      if (path === '/auth/refresh') return json(200, session());
      if (path === '/accounts/summary') return json(200, { balance: 0, accountCount: 0 });
      return json(200, []);
    });
    renderApp('/contas');

    expect(await screen.findByText('Nenhuma conta cadastrada')).toBeInTheDocument();
    expect(screen.queryByLabelText('Saldo em contas')).not.toBeInTheDocument();
  });
});
