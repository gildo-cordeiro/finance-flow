import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MoneyValue } from '@/components/ui/MoneyValue';

describe('MoneyValue', () => {
  it('usa a cor neutra quando o valor é zero', () => {
    render(<MoneyValue amount={0} data-testid="valor" />);
    expect(screen.getByTestId('valor')).toHaveClass('text-text-primary');
  });

  it('usa a cor de sucesso para valor positivo e mostra o sinal', () => {
    render(<MoneyValue amount={10} data-testid="valor" />);
    const el = screen.getByTestId('valor');
    expect(el).toHaveClass('text-success');
    expect(el.textContent).toContain('+');
  });

  it('usa a cor de perigo para valor negativo', () => {
    render(<MoneyValue amount={-10} data-testid="valor" />);
    expect(screen.getByTestId('valor')).toHaveClass('text-danger');
  });

  it('com variant="expense", valor positivo usa a cor de perigo', () => {
    render(<MoneyValue amount={10} variant="expense" showSign={false} data-testid="valor" />);
    const el = screen.getByTestId('valor');
    expect(el).toHaveClass('text-danger');
    expect(el.textContent).not.toContain('+');
  });
});
