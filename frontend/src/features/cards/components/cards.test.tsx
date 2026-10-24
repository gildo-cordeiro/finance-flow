import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { json, noContent, problem, session, stubFetch } from '@/test/fetchMock';
import { renderApp } from '@/test/renderApp';
import type { Card, Invoice, InvoiceDetail } from '../types';

const nubank: Card = {
  id: 'card-1',
  name: 'Nubank',
  brand: 'Mastercard',
  creditLimit: 8000,
  closingDay: 25,
  dueDay: 5,
  competenceOffset: 1,
  defaultPaymentAccountId: null,
  archived: false,
};

const outubro: Invoice = {
  id: 'inv-10',
  cardId: 'card-1',
  closingDate: '2026-10-25',
  dueDate: '2026-11-05',
  competenceMonth: '2026-10',
  status: 'OPEN',
  total: 1873.22,
  paidAmount: 0,
  itemCount: 2,
};
const setembro: Invoice = { ...outubro, id: 'inv-9', closingDate: '2026-09-25', dueDate: '2026-10-05', competenceMonth: '2026-09', status: 'CLOSED', total: 100, itemCount: 1 };

const detalheOutubro: InvoiceDetail = {
  invoice: outubro,
  cardName: 'Nubank',
  items: [
    {
      id: 'item-1',
      description: 'Notebook',
      amount: 583.33,
      categoryId: 'c-1',
      categoryName: 'Educação',
      parentCategoryName: null,
      purchaseDate: '2026-07-25',
      installmentNumber: 3,
      totalInstallments: 6,
      paid: false,
      recurring: false,
    },
    {
      id: 'item-2',
      description: 'Supermercado',
      amount: 1289.89,
      categoryId: 'c-2',
      categoryName: 'Supermercado',
      parentCategoryName: 'Alimentação',
      purchaseDate: '2026-10-15',
      installmentNumber: null,
      totalInstallments: null,
      paid: false,
      recurring: false,
    },
  ],
  previousInvoiceId: 'inv-9',
  nextInvoiceId: null,
};

const categories = [
  { id: 'c-1', name: 'Educação', type: 'EXPENSE', parentId: null, archived: false, subcategories: [] },
  {
    id: 'c-3',
    name: 'Alimentação',
    type: 'EXPENSE',
    parentId: null,
    archived: false,
    subcategories: [{ id: 'c-2', name: 'Supermercado', type: 'EXPENSE', parentId: 'c-3', archived: false, subcategories: [] }],
  },
];

type Call = { method: string; path: string; init: RequestInit };

function stubCardsApi(onWrite: (call: Call) => Response = () => problem(500, 'INTERNAL_ERROR')) {
  return stubFetch((call) => {
    if (call.path === '/auth/refresh') return json(200, session());
    if (call.method !== 'GET') return onWrite(call);
    if (call.path.startsWith('/cards?')) return json(200, [nubank]);
    if (call.path === '/cards/card-1/invoices/current') return json(200, outubro);
    if (call.path === '/cards/card-1/invoices') return json(200, [setembro, outubro]);
    if (call.path.startsWith('/cards/card-1/invoices/preview')) {
      return json(200, { closingDate: '2026-10-25', dueDate: '2026-11-05', competenceMonth: '2026-10' });
    }
    if (call.path === '/invoices/inv-10') return json(200, detalheOutubro);
    if (call.path === '/invoices/inv-9') return json(200, { ...detalheOutubro, invoice: setembro, items: [], previousInvoiceId: null, nextInvoiceId: 'inv-10' });
    if (call.path.startsWith('/accounts/summary')) return json(200, { balance: 0, accountCount: 0 });
    if (call.path.startsWith('/accounts')) return json(200, []);
    if (call.path.startsWith('/categories')) return json(200, categories);
    return problem(404, 'NOT_FOUND');
  });
}

function bodyOf(fetchMock: ReturnType<typeof stubFetch>, path: string, method: string) {
  const call = fetchMock.mock.calls.find(([input, init]) => String(input) === `/api/v1${path}` && init?.method === method);
  return JSON.parse(String(call?.[1]?.body));
}

describe('cartões', () => {
  it('lista o cartão com a fatura atual em Contas e cartões', async () => {
    stubCardsApi();
    renderApp('/contas');

    const section = await screen.findByRole('region', { name: 'Cartões de crédito' });
    expect(await within(section).findByText('Nubank')).toBeInTheDocument();
    expect(within(section).getByText(/fecha dia 25 · vence dia 5/)).toBeInTheDocument();
    const invoice = await within(section).findByRole('link', { name: 'Fatura atual de Nubank' });
    expect(invoice).toHaveAttribute('href', '/cartoes/card-1/fatura');
    expect(invoice).toHaveTextContent('R$ 1.873,22');
    expect(invoice).toHaveTextContent('Aberta');
  });

  it('cadastra um cartão com deslocamento 1 por padrão', async () => {
    const fetchMock = stubCardsApi((call) => (call.path === '/cards' ? json(201, nubank) : problem(500, 'INTERNAL_ERROR')));
    renderApp('/contas');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Novo cartão' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('Nome'), 'Nubank');
    await user.type(within(dialog).getByLabelText('Limite'), '800000');
    await user.type(within(dialog).getByLabelText('Dia de fechamento'), '25');
    await user.type(within(dialog).getByLabelText('Dia de vencimento'), '5');
    await user.click(within(dialog).getByRole('button', { name: 'Salvar cartão' }));

    expect(await screen.findByText('Cartão criado.')).toBeInTheDocument();
    expect(bodyOf(fetchMock, '/cards', 'POST')).toEqual({
      name: 'Nubank',
      brand: null,
      creditLimit: 8000,
      closingDay: 25,
      dueDay: 5,
      competenceOffset: 1,
      defaultPaymentAccountId: null,
    });
  });

  it('valida os dias antes de enviar', async () => {
    stubCardsApi();
    renderApp('/contas');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Novo cartão' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('Nome'), 'Nubank');
    await user.type(within(dialog).getByLabelText('Dia de fechamento'), '32');
    await user.click(within(dialog).getByRole('button', { name: 'Salvar cartão' }));

    expect(await within(dialog).findAllByText('Use um dia de 1 a 31')).toHaveLength(2);
  });
});

describe('fatura', () => {
  it('mostra a fatura atual com itens, competência e parcela', async () => {
    stubCardsApi();
    renderApp('/cartoes/card-1/fatura');

    expect(await screen.findByRole('heading', { name: 'Fatura que vence em 05/11/2026' })).toBeInTheDocument();
    expect(screen.getByLabelText('Total da fatura')).toHaveTextContent('R$ 1.873,22');
    expect(screen.getByText('outubro 2026')).toBeInTheDocument();
    const items = await screen.findByRole('list', { name: 'Itens da fatura' });
    expect(within(items).getByText('3/6')).toBeInTheDocument();
    expect(within(items).getByText('Alimentação › Supermercado')).toBeInTheDocument();
  });

  it('navega para a fatura anterior', async () => {
    stubCardsApi();
    renderApp('/cartoes/card-1/fatura');
    const user = userEvent.setup();

    expect(await screen.findByRole('button', { name: 'Próxima fatura' })).toBeDisabled();
    await user.click(await screen.findByRole('link', { name: 'Fatura anterior' }));

    expect(await screen.findByRole('heading', { name: 'Fatura que vence em 05/10/2026' })).toBeInTheDocument();
    expect(await screen.findByText('Nenhuma compra nesta fatura')).toBeInTheDocument();
  });

  it('lança compra parcelada mostrando em que fatura ela entra', async () => {
    const fetchMock = stubCardsApi((call) =>
      call.path === '/cards/card-1/purchases' ? json(201, []) : problem(500, 'INTERNAL_ERROR')
    );
    renderApp('/cartoes/card-1/fatura');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Nova compra' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('Valor total'), '300000');
    await user.type(within(dialog).getByLabelText('Descrição'), 'Notebook');
    await within(dialog).findByRole('option', { name: 'Educação' });
    await user.selectOptions(within(dialog).getByLabelText('Categoria'), 'c-1');
    await user.clear(within(dialog).getByLabelText('Data da compra'));
    await user.type(within(dialog).getByLabelText('Data da compra'), '2026-10-24');
    await user.clear(within(dialog).getByLabelText('Parcelas'));
    await user.type(within(dialog).getByLabelText('Parcelas'), '3');

    expect(await within(dialog).findByRole('status')).toHaveTextContent(
      'A primeira parcela entra na fatura que vence em 05/11/2026, competência outubro 2026.'
    );
    await user.click(within(dialog).getByRole('button', { name: 'Lançar compra' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(bodyOf(fetchMock, '/cards/card-1/purchases', 'POST')).toEqual({
      description: 'Notebook',
      amount: 3000,
      categoryId: 'c-1',
      purchaseDate: '2026-10-24',
      installments: 3,
    });
  });

  it('exclui a compra parcelada inteira depois de confirmar', async () => {
    const fetchMock = stubCardsApi((call) =>
      call.path === '/card-purchases/item-1' ? noContent() : problem(500, 'INTERNAL_ERROR')
    );
    renderApp('/cartoes/card-1/faturas/inv-10');
    const user = userEvent.setup();

    const items = await screen.findByRole('list', { name: 'Itens da fatura' });
    await user.click(within(items).getByRole('button', { name: 'Excluir Notebook' }));
    await user.click(within(items).getByRole('button', { name: 'Excluir as 6 parcelas' }));

    expect(await screen.findByText('Compra e parcelas excluídas.')).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([input, init]) => String(input) === '/api/v1/card-purchases/item-1' && init?.method === 'DELETE')).toBe(true);
  });

  it('mostra o erro de fatura de outro usuário', async () => {
    stubFetch((call) => (call.path === '/auth/refresh' ? json(200, session()) : problem(404, 'NOT_FOUND')));
    renderApp('/cartoes/card-x/faturas/inv-x');

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});
