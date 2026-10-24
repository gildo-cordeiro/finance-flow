import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { json, problem, session, stubFetch } from '@/test/fetchMock';
import { renderApp } from '@/test/renderApp';
import type { DashboardSummary } from '../types';

const summary = (overrides: Partial<DashboardSummary> = {}): DashboardSummary => ({
  month: '2026-10',
  income: { realized: 9850, paid: 8650, pending: 1200 },
  expense: { realized: 6432.18, paid: 4327.28, pending: 2104.9 },
  balance: 3417.82,
  accountsBalance: 14380.55,
  accounts: [
    { id: 'a-1', name: 'Nubank', savings: false, balance: 8210.33 },
    { id: 'a-2', name: 'Caixa', savings: true, balance: 6170.22 },
  ],
  payables: {
    items: [
      { id: 't-1', description: 'Conta de luz', amount: 212.4, accountName: 'Itaú', categoryName: 'Moradia', dueDate: '2026-10-20', overdue: true },
      { id: 't-2', description: 'Internet', amount: 119.9, accountName: 'Itaú', categoryName: 'Moradia', dueDate: '2026-10-25', overdue: false },
    ],
    overdueCount: 1,
  },
  upcomingInvoices: [
    { id: 'inv-1', cardId: 'card-1', cardName: 'Nubank', dueDate: '2026-10-20', total: 900, openAmount: 400, partiallyPaid: true, overdue: true },
    { id: 'inv-2', cardId: 'card-2', cardName: 'Inter', dueDate: '2026-11-05', total: 1250.5, openAmount: 1250.5, partiallyPaid: false, overdue: false },
  ],
  budget: {
    planned: 7200,
    realized: 6432.18,
    percentUsed: 89,
    topCategories: [
      { categoryId: 'c-1', name: 'Alimentação', planned: 1400, realized: 1512.3, percentUsed: 108 },
      { categoryId: 'c-2', name: 'Lazer', planned: null, realized: 245, percentUsed: null },
    ],
  },
  ...overrides,
});

type Call = { method: string; path: string; init: RequestInit };

function stubApi(body: DashboardSummary, writes: Call[] = []) {
  return stubFetch((call) => {
    if (call.path === '/auth/refresh') return json(200, session());
    if (call.method !== 'GET') {
      writes.push(call);
      return json(200, {});
    }
    if (call.path.startsWith('/dashboard/summary')) return json(200, body);
    return problem(404, 'NOT_FOUND');
  });
}

describe('painel', () => {
  it('lista as faturas a vencer com o saldo em aberto e o link para a fatura', async () => {
    stubApi(summary());
    renderApp('/?mes=2026-10');

    const list = await screen.findByRole('list', { name: 'Faturas a vencer' });
    const links = within(list).getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/cartoes/card-1/faturas/inv-1');
    expect(links[0]).toHaveTextContent('Venceu 20/10/2026 · paga em parte');
    expect(within(list).getByLabelText('Em aberto na fatura de Nubank')).toHaveTextContent('R$ 400,00');
    expect(links[1]).toHaveTextContent('Vence 05/11/2026');
  });

  it('sem faturas em aberto, avisa no bloco de faturas', async () => {
    stubApi(summary({ upcomingInvoices: [] }));
    renderApp('/?mes=2026-10');

    expect(await screen.findByText('Nenhuma fatura em aberto')).toBeInTheDocument();
  });

  it('mostra o resumo da competência, as contas e o orçamento em destaque', async () => {
    const fetchMock = stubApi(summary());
    renderApp('/?mes=2026-10');

    expect(await screen.findByLabelText('Receitas do mês')).toHaveTextContent('+R$ 9.850,00');
    expect(screen.getByLabelText('Despesas do mês')).toHaveTextContent('-R$ 6.432,18');
    expect(screen.getByLabelText('Resultado do mês')).toHaveTextContent('+R$ 3.417,82');
    expect(screen.getByLabelText('Saldo em contas')).toHaveTextContent('R$ 14.380,55');
    expect(screen.getByText('Hoje, em 2 contas')).toBeInTheDocument();
    expect(screen.getByText('R$ 2.104,90 ainda a pagar')).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: 'Saldos das contas' })).getByText('Poupança')).toBeInTheDocument();
    const budget = screen.getByRole('list', { name: 'Categorias em destaque' });
    expect(within(budget).getByText('Estourado')).toBeInTheDocument();
    expect(within(budget).getByText('Sem limite')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Abrir orçamento' })).toHaveAttribute('href', '/orcamento?mes=2026-10');
    expect(fetchMock.mock.calls.some(([input]) => String(input) === '/api/v1/dashboard/summary?month=2026-10')).toBe(true);
  });

  it('lista o que está a pagar e paga pela própria linha', async () => {
    const writes: Call[] = [];
    stubApi(summary(), writes);
    renderApp('/?mes=2026-10');

    const list = await screen.findByRole('list', { name: 'Despesas a pagar' });
    expect(screen.getByText('1 despesa atrasada')).toBeInTheDocument();
    expect(within(list).getByText('Atrasado')).toBeInTheDocument();
    expect(within(list).getByText(/venceu 20\/10\/2026/)).toBeInTheDocument();

    await userEvent.setup().click(within(list).getByRole('button', { name: 'Pagar Conta de luz' }));

    expect(await screen.findByText('Conta de luz marcada como paga.')).toBeInTheDocument();
    expect(writes.map((call) => `${call.method} ${call.path}`)).toEqual(['POST /transactions/t-1/pay']);
  });

  it('sem contas, orienta a cadastrar a primeira', async () => {
    stubApi(summary({ accounts: [], accountsBalance: 0 }));
    renderApp('/');

    expect(await screen.findByText('Cadastre sua primeira conta')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cadastrar conta' })).toHaveAttribute('href', '/contas');
  });

  it('o atalho "Nova transação" abre o formulário na tela de transações', async () => {
    stubFetch((call) => {
      if (call.path === '/auth/refresh') return json(200, session());
      if (call.path.startsWith('/dashboard/summary')) return json(200, summary());
      if (call.path.startsWith('/transactions?')) {
        return json(200, { items: [], page: 0, size: 50, totals: { count: 0, income: 0, expense: 0, balance: 0 } });
      }
      return json(200, []);
    });
    renderApp('/');

    await userEvent.setup().click(await screen.findByRole('link', { name: 'Nova transação' }));

    expect(await screen.findByRole('dialog', { name: 'Nova transação' })).toBeInTheDocument();
  });
});
