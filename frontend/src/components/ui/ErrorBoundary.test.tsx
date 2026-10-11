import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

let shouldThrow = true;

function Bomb() {
  if (shouldThrow) throw new Error('boom');
  return <p>conteúdo ok</p>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    shouldThrow = true;
    // O React registra o erro capturado no console; silencia para manter a saída limpa.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renderiza os filhos quando não há erro', () => {
    shouldThrow = false;
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText('conteúdo ok')).toBeInTheDocument();
  });

  it('mostra o fallback padrão quando um filho lança erro', () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Algo deu errado nesta tela');
  });

  it('usa o fallback customizado quando informado', () => {
    render(
      <ErrorBoundary fallback={<p>fallback próprio</p>}>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText('fallback próprio')).toBeInTheDocument();
  });

  it('volta a renderizar os filhos ao clicar em "Tentar novamente"', async () => {
    const user = userEvent.setup();
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    shouldThrow = false;
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(screen.getByText('conteúdo ok')).toBeInTheDocument();
  });
});
