import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { problem, stubFetch } from '@/test/fetchMock';
import { renderApp } from '@/test/renderApp';

describe('App', () => {
  it('sem sessão, abre a tela de login', async () => {
    stubFetch(() => problem(401, 'INVALID_REFRESH_TOKEN'));
    renderApp('/');
    expect(await screen.findByRole('heading', { name: 'Entrar no FinanceFlow' })).toBeInTheDocument();
  });
});
