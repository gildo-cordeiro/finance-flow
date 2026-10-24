import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { json, noContent, problem, session, stubFetch } from '@/test/fetchMock';
import { renderApp } from '@/test/renderApp';
import type { Category } from '../types';

const profile = {
  id: 'u-1',
  name: 'Maria Silva',
  email: 'maria@exemplo.com',
  timezone: 'America/Sao_Paulo',
  currency: 'BRL',
  privacyVersion: '2026-10',
};

function category(id: string, name: string, extra: Partial<Category> = {}): Category {
  return { id, name, type: 'EXPENSE', parentId: null, archived: false, subcategories: [], ...extra };
}

const mercado = category('c-2', 'Supermercado', { parentId: 'c-1' });
const alimentacao = category('c-1', 'Alimentação', { subcategories: [mercado] });
const lazer = category('c-3', 'Lazer');
const salario = category('c-4', 'Salário', { type: 'INCOME' });
const antiga = category('c-5', 'Antiga', { archived: true });

type Call = { method: string; path: string; init: RequestInit };

function stubCategoriesApi(onWrite: (call: Call) => Response = () => problem(500, 'INTERNAL_ERROR')) {
  return stubFetch((call) => {
    if (call.path === '/auth/refresh') return json(200, session());
    if (call.path === '/me') return json(200, profile);
    if (call.path === '/categories?type=EXPENSE&includeArchived=false') return json(200, [alimentacao, lazer]);
    if (call.path === '/categories?type=EXPENSE&includeArchived=true') return json(200, [alimentacao, antiga, lazer]);
    if (call.path === '/categories?type=INCOME&includeArchived=false') return json(200, [salario]);
    if (call.path.startsWith('/categories')) return onWrite(call);
    return problem(404, 'NOT_FOUND');
  });
}

function writes(fetchMock: ReturnType<typeof stubFetch>) {
  return fetchMock.mock.calls
    .map(([input, init]) => ({ path: String(input).replace(/^\/api\/v1/, ''), method: init?.method ?? 'GET', init }))
    .filter(({ method, path }) => method !== 'GET' && path.startsWith('/categories'));
}

async function openSettings() {
  renderApp('/configuracoes?aba=categorias');
  return within(await screen.findByRole('list', { name: 'Categorias de despesas' }));
}

describe('configurações: categorias', () => {
  it('mostra a árvore de despesas e troca para receitas', async () => {
    stubCategoriesApi();
    const list = await openSettings();
    const user = userEvent.setup();

    expect(list.getByText('Alimentação')).toBeInTheDocument();
    expect(list.getByText('Supermercado')).toBeInTheDocument();
    expect(list.queryByText('Salário')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Receitas' }));
    const income = await screen.findByRole('list', { name: 'Categorias de receitas' });
    expect(within(income).getByText('Salário')).toBeInTheDocument();
  });

  it('mostra as arquivadas quando pedido', async () => {
    stubCategoriesApi();
    await openSettings();
    const user = userEvent.setup();

    await user.click(screen.getByLabelText('Mostrar arquivadas'));

    expect(await screen.findByText('Antiga')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Desarquivar Antiga' })).toBeInTheDocument();
  });

  it('cria uma subcategoria do mesmo tipo da categoria pai', async () => {
    const fetchMock = stubCategoriesApi(({ init }) => json(201, { ...mercado, ...JSON.parse(String(init.body)), id: 'c-9' }));
    await openSettings();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Adicionar subcategoria em Alimentação' }));
    const sheet = await screen.findByRole('dialog', { name: 'Nova subcategoria' });
    await user.type(within(sheet).getByLabelText('Nome'), 'Padaria');
    await user.click(within(sheet).getByRole('button', { name: 'Criar' }));

    expect(await screen.findByText('Subcategoria criada.')).toBeInTheDocument();
    const [post] = writes(fetchMock);
    expect(post.path).toBe('/categories');
    expect(JSON.parse(String(post.init?.body))).toEqual({ name: 'Padaria', type: 'EXPENSE', parentId: 'c-1' });
  });

  it('renomeia e mostra o erro de nome repetido', async () => {
    const fetchMock = stubCategoriesApi(() => problem(409, 'CATEGORY_NAME_TAKEN'));
    await openSettings();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Renomear Lazer' }));
    const sheet = await screen.findByRole('dialog', { name: 'Renomear categoria' });
    const name = within(sheet).getByLabelText('Nome');
    expect(name).toHaveValue('Lazer');
    await user.clear(name);
    await user.type(name, 'Alimentação');
    await user.click(within(sheet).getByRole('button', { name: 'Salvar' }));

    expect(await within(sheet).findByText('Já existe uma categoria com esse nome neste nível.')).toBeInTheDocument();
    expect(writes(fetchMock)).toMatchObject([{ method: 'PUT', path: '/categories/c-3' }]);
  });

  it('mescla em outra categoria ativa do mesmo tipo', async () => {
    const fetchMock = stubCategoriesApi(() => json(200, { ...lazer, archived: true }));
    await openSettings();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Mesclar Lazer' }));
    const sheet = await screen.findByRole('dialog', { name: 'Mesclar categoria' });
    const target = within(sheet).getByLabelText('Mesclar em');
    const options = within(target).getAllByRole('option').map((option) => option.textContent);
    expect(options).toEqual(['Escolha a categoria', 'Alimentação', 'Alimentação › Supermercado']);
    await user.selectOptions(target, 'c-2');
    await user.click(within(sheet).getByRole('button', { name: 'Mesclar' }));

    expect(await screen.findByText('“Lazer” mesclada.')).toBeInTheDocument();
    const [merge] = writes(fetchMock);
    expect(merge.path).toBe('/categories/c-3/merge');
    expect(JSON.parse(String(merge.init?.body))).toEqual({ targetId: 'c-2' });
  });

  it('exige o destino da mesclagem', async () => {
    const fetchMock = stubCategoriesApi();
    await openSettings();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Mesclar Lazer' }));
    const sheet = await screen.findByRole('dialog', { name: 'Mesclar categoria' });
    await user.click(within(sheet).getByRole('button', { name: 'Mesclar' }));

    expect(await within(sheet).findByText('Escolha a categoria de destino')).toBeInTheDocument();
    expect(writes(fetchMock)).toHaveLength(0);
  });

  it('arquiva a categoria', async () => {
    const fetchMock = stubCategoriesApi(() => json(200, { ...lazer, archived: true }));
    await openSettings();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Arquivar Lazer' }));

    expect(await screen.findByText('Categoria arquivada.')).toBeInTheDocument();
    expect(writes(fetchMock)).toMatchObject([{ method: 'POST', path: '/categories/c-3/archive' }]);
  });

  it('explica por que a categoria em uso não pode ser excluída', async () => {
    stubCategoriesApi(() => problem(409, 'CATEGORY_IN_USE'));
    await openSettings();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Excluir Lazer' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar exclusão' }));

    expect(
      await screen.findByText('Esta categoria tem transações ou orçamento. Arquive ou mescle em outra.')
    ).toBeInTheDocument();
  });

  it('exclui a categoria sem uso', async () => {
    const fetchMock = stubCategoriesApi(() => noContent());
    await openSettings();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Excluir Supermercado' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar exclusão' }));

    expect(await screen.findByText('Categoria excluída.')).toBeInTheDocument();
    expect(writes(fetchMock)).toMatchObject([{ method: 'DELETE', path: '/categories/c-2' }]);
  });
});
