import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { json, noContent, problem, session, stubFetch } from '@/test/fetchMock';
import { renderApp } from '@/test/renderApp';
import type { Transaction, TransactionPage } from '../types';

const aluguel: Transaction = {
  id: 't-1',
  type: 'EXPENSE',
  description: 'Aluguel',
  amount: 1750,
  accountId: 'a-1',
  accountName: 'Nubank',
  categoryId: 'c-2',
  categoryName: 'Aluguel',
  parentCategoryName: 'Moradia',
  competenceMonth: '2026-10',
  dueDate: '2026-10-05',
  paymentDate: null,
  status: 'PENDING',
  visibility: 'PRIVATE',
  installmentNumber: null,
  totalInstallments: null,
  transferGroupId: null,
  transferDirection: null,
  recurring: false,
};
const reserva: Transaction = {
  ...aluguel,
  id: 't-2',
  type: 'TRANSFER',
  description: 'Reserva',
  amount: 500,
  categoryId: null,
  categoryName: null,
  parentCategoryName: null,
  status: 'PAID',
  paymentDate: '2026-10-10',
  transferGroupId: 'g-1',
  transferDirection: 'OUT',
};

const page = (items: Transaction[]): TransactionPage => ({
  items,
  page: 0,
  size: 50,
  totals: { count: items.length, income: 9850, expense: 1750, balance: 8100 },
});

const accounts = [{ id: 'a-1', name: 'Nubank', type: 'CHECKING', archived: false, balance: 0 }];
const categories = [
  {
    id: 'c-1',
    name: 'Moradia',
    type: 'EXPENSE',
    parentId: null,
    archived: false,
    subcategories: [{ id: 'c-2', name: 'Aluguel', type: 'EXPENSE', parentId: 'c-1', archived: false, subcategories: [] }],
  },
];

type Call = { method: string; path: string; init: RequestInit };

function stubApi(items: Transaction[], onWrite: (call: Call) => Response = () => problem(500, 'INTERNAL_ERROR')) {
  return stubFetch((call) => {
    if (call.path === '/auth/refresh') return json(200, session());
    if (call.method !== 'GET') return onWrite(call);
    if (call.path.startsWith('/transactions/competence-suggestion')) return json(200, { competenceMonth: '2026-09' });
    if (call.path.startsWith('/transactions?')) return json(200, page(items));
    if (call.path.startsWith('/accounts')) return json(200, accounts);
    if (call.path.startsWith('/categories?type=EXPENSE')) return json(200, categories);
    if (call.path.startsWith('/categories')) return json(200, []);
    return problem(404, 'NOT_FOUND');
  });
}

function listCalls(fetchMock: ReturnType<typeof stubFetch>) {
  return fetchMock.mock.calls.map(([input]) => String(input)).filter((path) => path.includes('/transactions?'));
}

describe('transações', () => {
  it('lista as transações do mês com os totais da seleção', async () => {
    const fetchMock = stubApi([aluguel, reserva]);
    renderApp('/transacoes?mes=2026-10');

    const table = await screen.findByRole('table');
    expect(within(table).getByText('Moradia › Aluguel')).toBeInTheDocument();
    expect(within(table).getByText('Transferência enviada')).toBeInTheDocument();
    expect(screen.getByLabelText('Total de receitas')).toHaveTextContent('+R$ 9.850,00');
    expect(screen.getByLabelText('Total de despesas')).toHaveTextContent('-R$ 1.750,00');
    expect(screen.getByLabelText('Resultado da seleção')).toHaveTextContent('+R$ 8.100,00');
    expect(listCalls(fetchMock)[0]).toContain('from=2026-10-01&to=2026-10-31&dateField=COMPETENCE');
    expect(within(table).queryByRole('button', { name: 'Editar Reserva' })).not.toBeInTheDocument();
  });

  it('troca o tipo de data e o status e refaz a busca', async () => {
    const fetchMock = stubApi([aluguel]);
    renderApp('/transacoes?mes=2026-10');
    const user = userEvent.setup();

    await screen.findByRole('table');
    await user.click(screen.getByRole('button', { name: 'Vencimento' }));
    await user.selectOptions(screen.getByLabelText('Status'), 'OVERDUE');

    await waitFor(() => {
      const calls = listCalls(fetchMock);
      const last = calls[calls.length - 1];
      expect(last).toContain('dateField=DUE');
      expect(last).toContain('status=OVERDUE');
    });
    expect(screen.getByRole('button', { name: 'Vencimento' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('mostra o estado vazio', async () => {
    stubApi([]);
    renderApp('/transacoes?mes=2026-10');

    expect(await screen.findByText('Nenhuma transação encontrada')).toBeInTheDocument();
  });

  it('lança uma despesa com a competência sugerida pelo backend', async () => {
    const fetchMock = stubApi([], (call) =>
      call.path === '/transactions' ? json(201, aluguel) : problem(500, 'INTERNAL_ERROR')
    );
    renderApp('/transacoes?mes=2026-10');
    const user = userEvent.setup();

    await screen.findByText('Nenhuma transação encontrada');
    await user.click(screen.getByRole('button', { name: 'Nova transação' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('Valor'), '175000');
    await user.type(within(dialog).getByLabelText('Descrição'), 'Aluguel');
    await user.selectOptions(await within(dialog).findByLabelText('Conta'), 'a-1');
    await user.selectOptions(within(dialog).getByLabelText('Categoria'), 'c-2');
    await user.clear(within(dialog).getByLabelText('Vencimento'));
    await user.type(within(dialog).getByLabelText('Vencimento'), '2026-10-05');

    expect(await within(dialog).findByText('Sugerida')).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/Competência/)).toHaveValue('2026-09');

    await user.click(within(dialog).getByRole('button', { name: 'Salvar transação' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST' && String(init.body).includes('Aluguel'));
    expect(JSON.parse(String(post?.[1]?.body))).toEqual({
      type: 'EXPENSE',
      description: 'Aluguel',
      amount: 1750,
      accountId: 'a-1',
      categoryId: 'c-2',
      competenceMonth: null,
      dueDate: '2026-10-05',
      paymentDate: null,
      status: null,
    });
  });

  it('mostra no campo o erro devolvido pela API', async () => {
    stubApi([aluguel], (call) =>
      call.method === 'PUT'
        ? problem(422, 'VALIDATION_FAILED', [{ field: 'categoryId', message: 'A categoria é de receita' }])
        : problem(500, 'INTERNAL_ERROR')
    );
    renderApp('/transacoes?mes=2026-10');
    const user = userEvent.setup();

    const table = await screen.findByRole('table');
    await user.click(within(table).getByRole('button', { name: 'Editar Aluguel' }));
    const dialog = await screen.findByRole('dialog');
    await within(dialog).findByRole('option', { name: 'Moradia › Aluguel' });
    await user.click(within(dialog).getByRole('button', { name: 'Salvar alterações' }));

    expect(await within(dialog).findByText('A categoria é de receita')).toBeInTheDocument();
  });

  it('marca como paga e exclui pela linha', async () => {
    const fetchMock = stubApi([aluguel], (call) => {
      if (call.path === '/transactions/t-1/pay') return json(200, { ...aluguel, status: 'PAID', paymentDate: '2026-10-24' });
      if (call.path === '/transactions/t-1' && call.method === 'DELETE') return noContent();
      return problem(500, 'INTERNAL_ERROR');
    });
    renderApp('/transacoes?mes=2026-10');
    const user = userEvent.setup();

    const table = await screen.findByRole('table');
    await user.click(within(table).getByRole('button', { name: 'Marcar como paga Aluguel' }));
    expect(await screen.findByText('Marcada como paga.')).toBeInTheDocument();

    await user.click(within(table).getByRole('button', { name: 'Excluir Aluguel' }));
    await user.click(within(table).getByRole('button', { name: 'Confirmar exclusão' }));
    expect(await screen.findByText('Transação excluída.')).toBeInTheDocument();

    const writes = fetchMock.mock.calls.filter(([, init]) => init?.method && init.method !== 'GET').map(([input]) => String(input))
      .filter((path) => path.includes('/transactions'));
    expect(writes).toEqual(['/api/v1/transactions/t-1/pay', '/api/v1/transactions/t-1']);
  });
});
