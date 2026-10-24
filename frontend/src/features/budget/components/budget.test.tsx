import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { json, problem, session, stubFetch } from '@/test/fetchMock';
import { renderApp } from '@/test/renderApp';
import type { Budget, BudgetLine } from '../types';

const line = (overrides: Partial<BudgetLine>): BudgetLine => ({
  categoryId: 'c-x',
  name: 'Categoria',
  type: 'EXPENSE',
  archived: false,
  directPlanned: null,
  planned: null,
  realized: 0,
  realizedPaid: 0,
  remaining: null,
  percentUsed: null,
  children: [],
  ...overrides,
});

const aluguel = line({ categoryId: 'c-2', name: 'Aluguel', directPlanned: 1750, planned: 1750, realized: 1750, realizedPaid: 1750, remaining: 0, percentUsed: 100 });
const moradia = line({ categoryId: 'c-1', name: 'Moradia', planned: 1750, realized: 1750, realizedPaid: 1750, remaining: 0, percentUsed: 100, children: [aluguel] });
const alimentacao = line({ categoryId: 'c-3', name: 'Alimentação', directPlanned: 1400, planned: 1400, realized: 1512.3, remaining: -112.3, percentUsed: 108 });
const lazer = line({ categoryId: 'c-4', name: 'Lazer', realized: 245 });
const viagens = line({ categoryId: 'c-5', name: 'Viagens' });
const salario = line({ categoryId: 'c-6', name: 'Salário', type: 'INCOME', directPlanned: 8000, planned: 8000, realized: 8000, realizedPaid: 8000, remaining: 0, percentUsed: 100 });

const totals = (planned: number, realized: number, percentUsed: number | null) => ({
  planned,
  realized,
  realizedPaid: realized,
  remaining: planned - realized,
  percentUsed,
});

const budget = (overrides: Partial<Budget> = {}): Budget => ({
  month: '2026-10',
  categories: [alimentacao, lazer, moradia, viagens, salario],
  totals: { expense: totals(3150, 3507.3, 111), income: totals(8000, 8000, 100) },
  previousMonthPlanned: 3150,
  ...overrides,
});

type Call = { method: string; path: string; init: RequestInit };

function stubApi(get: Budget, onWrite: (call: Call) => Response = () => problem(500, 'INTERNAL_ERROR')) {
  return stubFetch((call) => {
    if (call.path === '/auth/refresh') return json(200, session());
    if (call.method !== 'GET') return onWrite(call);
    if (call.path.startsWith('/budgets/')) return json(200, get);
    return problem(404, 'NOT_FOUND');
  });
}

describe('orçamento', () => {
  it('mostra planejado, realizado e saldo por categoria, com as subcategorias', async () => {
    const fetchMock = stubApi(budget());
    renderApp('/orcamento?mes=2026-10');

    const list = await screen.findByRole('list', { name: 'Categorias do orçamento' });
    expect(within(list).getByRole('link', { name: 'Alimentação' })).toHaveAttribute('href', '/transacoes?mes=2026-10&categoria=c-3');
    expect(within(list).getByRole('button', { name: 'Planejado de Alimentação' })).toHaveTextContent('R$ 1.400,00');
    expect(within(list).getByLabelText('Saldo de Alimentação')).toHaveTextContent('-R$ 112,30');
    expect(within(list).getByText('Estourado')).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: 'Subcategorias de Moradia' })).getByText('Aluguel')).toBeInTheDocument();
    expect(within(list).getByRole('button', { name: 'Planejado de Lazer' })).toHaveTextContent('Definir');
    expect(screen.getByLabelText('Total planejado')).toHaveTextContent('R$ 3.150,00');
    expect(screen.getByText('111% do planejado')).toBeInTheDocument();
    expect(screen.getByText('1 categoria acima do limite')).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([input]) => String(input) === '/api/v1/budgets/2026-10')).toBe(true);
  });

  it('esconde as categorias sem planejado e sem gasto até pedir, e separa receitas', async () => {
    stubApi(budget());
    renderApp('/orcamento?mes=2026-10');
    const user = userEvent.setup();

    await screen.findByRole('list', { name: 'Categorias do orçamento' });
    expect(screen.queryByRole('link', { name: 'Viagens' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Mostrar categorias sem planejado e sem gasto \(1\)/ }));
    expect(screen.getByRole('link', { name: 'Viagens' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Receitas' }));
    expect(screen.getByRole('link', { name: 'Salário' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Alimentação' })).not.toBeInTheDocument();
  });

  it('edita o planejado na linha: Enter salva e Esc cancela', async () => {
    const writes: Call[] = [];
    stubApi(budget(), (call) => {
      writes.push(call);
      return json(200, budget({ categories: [line({ ...lazer, directPlanned: 300, planned: 300, remaining: 55, percentUsed: 82 })] }));
    });
    renderApp('/orcamento?mes=2026-10');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Planejado de Lazer' }));
    await user.type(screen.getByRole('textbox', { name: 'Planejado de Lazer' }), '999{Escape}');
    expect(writes).toHaveLength(0);

    await user.click(screen.getByRole('button', { name: 'Planejado de Lazer' }));
    await user.type(screen.getByRole('textbox', { name: 'Planejado de Lazer' }), '30000{Enter}');

    expect(await screen.findByRole('button', { name: 'Planejado de Lazer' })).toHaveTextContent('R$ 300,00');
    expect(writes).toHaveLength(1);
    expect(writes[0].method).toBe('PUT');
    expect(writes[0].path).toBe('/budgets/2026-10/categories/c-4');
    expect(JSON.parse(String(writes[0].init.body))).toEqual({ plannedAmount: 300 });
  });

  it('mês sem orçamento oferece copiar do anterior', async () => {
    const empty = budget({
      categories: [lazer, viagens],
      totals: { expense: totals(0, 245, null), income: totals(0, 0, null) },
    });
    const writes: Call[] = [];
    stubApi(empty, (call) => {
      writes.push(call);
      return json(200, budget());
    });
    renderApp('/orcamento?mes=2026-10');

    expect(await screen.findByText(/ainda não tem orçamento/)).toBeInTheDocument();
    expect(screen.getByText(/Já existem R\$ 245,00 em despesas/)).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: /Copiar de setembro 2026 \(R\$\s3\.150,00\)/ }));

    expect(await screen.findByRole('list', { name: 'Categorias do orçamento' })).toBeInTheDocument();
    expect(writes.map((call) => `${call.method} ${call.path}`)).toEqual(['POST /budgets/2026-10/copy-from-previous']);
  });

  it('copiar sem orçamento no mês anterior mostra a mensagem do code', async () => {
    stubApi(budget(), () => problem(409, 'NO_PREVIOUS_BUDGET'));
    renderApp('/orcamento?mes=2026-10');

    await userEvent.setup().click(await screen.findByRole('button', { name: 'Copiar do mês anterior' }));

    expect(await screen.findByText('O mês anterior não tem orçamento para copiar.')).toBeInTheDocument();
  });
});
