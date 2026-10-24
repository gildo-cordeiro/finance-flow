import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { callsTo, json, problem, session, stubFetch } from '@/test/fetchMock';
import { renderApp } from '@/test/renderApp';

const profile = {
  id: 'u-1',
  name: 'Maria Silva',
  email: 'maria@exemplo.com',
  timezone: 'America/Sao_Paulo',
  currency: 'BRL',
  privacyVersion: '2026-10',
};

type Call = { method: string; path: string; init: RequestInit };

function stubProfileApi(onUpdate: (call: Call) => Response) {
  return stubFetch((call) => {
    if (call.path === '/auth/refresh') return json(200, session());
    if (call.path === '/me' && call.method === 'GET') return json(200, profile);
    if (call.path === '/me' && call.method === 'PUT') return onUpdate(call);
    return problem(404, 'NOT_FOUND');
  });
}

describe('configurações: perfil', () => {
  it('mostra o perfil com o Brasil no topo da lista de fusos', async () => {
    stubProfileApi(() => problem(500, 'INTERNAL_ERROR'));
    renderApp('/configuracoes');

    expect(await screen.findByLabelText('Nome')).toHaveValue('Maria Silva');
    expect(screen.getByLabelText('E-mail')).toHaveValue('maria@exemplo.com');
    const timezone = screen.getByLabelText('Fuso horário');
    expect(timezone).toHaveValue('America/Sao_Paulo');
    const [brazil, others] = within(timezone).getAllByRole('group');
    expect(brazil).toHaveAttribute('label', 'Brasil');
    expect(within(brazil).getByRole('option', { name: 'Manaus (AM)' })).toBeInTheDocument();
    expect(within(others).getByRole('option', { name: 'Europe/Lisbon' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeDisabled();
  });

  it('salva nome e fuso, confirma e atualiza o nome na navegação', async () => {
    const fetchMock = stubProfileApi(({ init }) =>
      json(200, { ...profile, ...JSON.parse(String(init.body)) })
    );
    renderApp('/configuracoes');
    const user = userEvent.setup();

    const name = await screen.findByLabelText('Nome');
    await user.clear(name);
    await user.type(name, 'Maria Souza');
    await user.selectOptions(screen.getByLabelText('Fuso horário'), 'America/Manaus');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByText('Perfil atualizado.')).toBeInTheDocument();
    const [put] = callsTo(fetchMock, '/me').filter(([, init]) => init?.method === 'PUT');
    expect(JSON.parse(String(put[1]?.body))).toEqual({ name: 'Maria Souza', timezone: 'America/Manaus' });
    expect(screen.getAllByText('Maria Souza').length).toBeGreaterThan(0);
    expect(screen.queryByText('Maria Silva')).not.toBeInTheDocument();
  });

  it('marca o campo recusado pela API', async () => {
    stubProfileApi(() =>
      problem(422, 'VALIDATION_FAILED', [{ field: 'timezone', message: 'Fuso horário inválido' }])
    );
    renderApp('/configuracoes');
    const user = userEvent.setup();

    await user.selectOptions(await screen.findByLabelText('Fuso horário'), 'Europe/Lisbon');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByText('Fuso horário inválido')).toBeInTheDocument();
    expect(screen.getByLabelText('Fuso horário')).toHaveAttribute('aria-invalid', 'true');
  });

  it('mostra a mensagem do erro quando não é de um campo', async () => {
    stubProfileApi(() => problem(500, 'INTERNAL_ERROR'));
    renderApp('/configuracoes');
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('Nome'), ' Jr.');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByText('Ocorreu um erro inesperado. Tente novamente em instantes.')).toBeInTheDocument();
  });

  it('valida o nome antes de enviar', async () => {
    const fetchMock = stubProfileApi(() => problem(500, 'INTERNAL_ERROR'));
    renderApp('/configuracoes');
    const user = userEvent.setup();

    await user.clear(await screen.findByLabelText('Nome'));
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByText('Informe seu nome')).toBeInTheDocument();
    expect(callsTo(fetchMock, '/me').filter(([, init]) => init?.method === 'PUT')).toHaveLength(0);
  });

  it('avisa quando o perfil não carrega', async () => {
    stubFetch(({ path }) => {
      if (path === '/auth/refresh') return json(200, session());
      if (path.startsWith('/categories')) return json(200, []);
      return problem(500, 'INTERNAL_ERROR');
    });
    renderApp('/configuracoes');

    expect(
      await screen.findByText('Ocorreu um erro inesperado. Tente novamente em instantes.')
    ).toBeInTheDocument();
  });
});
