import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from '@/components/ui/ProgressBar';

const fill = (bar: HTMLElement) => bar.firstElementChild as HTMLElement;

describe('ProgressBar', () => {
  it('preenche pela proporção mesmo com centavos', () => {
    render(<ProgressBar value={150.5} max={500} label="Progresso de Mercado" />);
    const bar = screen.getByRole('progressbar', { name: 'Progresso de Mercado' });
    expect(fill(bar).style.width).toBe('30%');
    expect(bar).toHaveAttribute('aria-valuenow', '150.5');
    expect(bar).toHaveAttribute('aria-valuemax', '500');
    expect(document.querySelector('style')).toBeNull();
  });

  it('limita o preenchimento a 100% e marca o estouro', () => {
    render(<ProgressBar value={612.35} max={500} label="Progresso de Lazer" />);
    const bar = screen.getByRole('progressbar', { name: 'Progresso de Lazer' });
    expect(fill(bar).style.width).toBe('100%');
    expect(fill(bar)).toHaveClass('bg-danger');
    expect(screen.getByText('Estourado')).toBeInTheDocument();
  });

  it('usa a cor de atenção a partir de 80%', () => {
    render(<ProgressBar value={400.01} max={500} label="Progresso de Casa" />);
    expect(fill(screen.getByRole('progressbar'))).toHaveClass('bg-warning');
  });

  it('mostra "Sem limite" quando não há máximo', () => {
    render(<ProgressBar value={100} max={null} />);
    expect(screen.getByText('Sem limite')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });
});
