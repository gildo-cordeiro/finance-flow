import { beforeAll, describe, expect, it, vi } from 'vitest';
import { BudgetRow } from './BudgetRow';
import { ProgressBar } from '../../../components/ui/ProgressBar';

beforeAll(() => {
  if (typeof globalThis.localStorage === 'undefined') {
    globalThis.localStorage = {
      getItem: () => 'BRL',
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    };
  }
});

describe('ProgressBar (UX-11 Color bands and limits)', () => {
  it('renders "Sem limite" when max is null or 0', () => {
    const element = ProgressBar({ value: 50, max: null });
    expect(element).toBeDefined();

    // Verify it contains "Sem limite" and dashed border
    const [headerDiv, barDiv] = element.props.children;
    expect(headerDiv.props.children.props.children).toBe('Sem limite');
    expect(barDiv.props.className).toContain('border-dashed');
  });

  it('uses success color (<80%) when percentage is below 80%', () => {
    const element = ProgressBar({ value: 50, max: 100 });
    const [, headerDiv, barContainer] = element.props.children;

    // Header percentage text color
    const [percentSpan] = headerDiv.props.children;
    expect(percentSpan.props.className).toContain('text-success');
    expect(percentSpan.props.children).toEqual([50, '%']);

    // Progress bar fill color
    const barFill = barContainer.props.children[0];
    expect(barFill.props.className).toContain('bg-success');
  });

  it('uses warning color (80–100%) when percentage is between 80% and 100%', () => {
    // 80%
    const element80 = ProgressBar({ value: 80, max: 100 });
    const [, header80, barContainer80] = element80.props.children;
    const [percentSpan80] = header80.props.children;
    expect(percentSpan80.props.className).toContain('text-warning');
    expect(barContainer80.props.children[0].props.className).toContain('bg-warning');

    // 100%
    const element100 = ProgressBar({ value: 100, max: 100 });
    const [, header100, barContainer100] = element100.props.children;
    const [percentSpan100] = header100.props.children;
    expect(percentSpan100.props.className).toContain('text-warning');
    expect(barContainer100.props.children[0].props.className).toContain('bg-warning');
  });

  it('uses danger color and displays "Estourado" when percentage is strictly above 100%', () => {
    const element = ProgressBar({ value: 120, max: 100 });
    const [, headerDiv, barContainer] = element.props.children;

    const [percentSpan, , , overLimitBadge] = headerDiv.props.children;
    expect(percentSpan.props.className).toContain('text-danger');
    expect(barContainer.props.children[0].props.className).toContain('bg-danger');

    expect(overLimitBadge).toBeDefined();
    expect(overLimitBadge.props.children).toBe('Estourado');
  });
});

describe('BudgetRow (UX-11 Numeric columns, zero values, and inline editing)', () => {
  const defaultProps = {
    categoryId: 'cat-1',
    categoryName: 'Alimentação',
    plannedAmount: 1000,
    realizedAmount: 500,
    userId: 'user-1',
    parentCategoryId: null,
    isEditing: false,
    isEditable: true,
    isCollapsed: false,
    hasChildren: false,
    onToggleCollapse: vi.fn(),
    onStartEditing: vi.fn(),
    onSave: vi.fn(),
    onCancelEditing: vi.fn(),
    editValue: '',
    onEditValueChange: vi.fn(),
    saveError: null,
    formatCurrency: (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`,
    isCouple: false,
    partnerName: 'Parceiro',
    user: { id: 'user-1', name: 'Usuário' },
  };

  it('renders "—" in text-text-muted for Gasto and Restante when amounts are 0', () => {
    const element = BudgetRow({
      ...defaultProps,
      plannedAmount: 0,
      realizedAmount: 0,
    });

    const cells = element.props.children;
    const orcadoCell = cells[1];
    const gastoCell = cells[2];
    const restanteCell = cells[3];

    // Orçado should show Definir button when plannedAmount is 0
    expect(orcadoCell.props.className).toContain('text-right');
    expect(orcadoCell.props.className).toContain('tabular-nums');
    const orcadoButton = orcadoCell.props.children[0].props.children;
    expect(orcadoButton.props.children).toBe('Definir');

    // Gasto should show "—" in text-text-muted
    expect(gastoCell.props.className).toContain('text-right');
    expect(gastoCell.props.className).toContain('tabular-nums');
    expect(gastoCell.props.children.props.className).toContain('text-text-muted');
    expect(gastoCell.props.children.props.children).toBe('—');

    // Restante should show "—" in text-text-muted
    expect(restanteCell.props.className).toContain('text-right');
    expect(restanteCell.props.className).toContain('tabular-nums');
    expect(restanteCell.props.children.props.className).toContain('text-text-muted');
    expect(restanteCell.props.children.props.children).toBe('—');
  });

  it('renders formatted values with text-right, tabular-nums, and pencil button only on hover when planned > 0', () => {
    const element = BudgetRow({
      ...defaultProps,
      plannedAmount: 1000,
      realizedAmount: 300,
    });

    const cells = element.props.children;
    const orcadoCell = cells[1];
    const gastoCell = cells[2];
    const restanteCell = cells[3];

    // Check Orçado cell
    expect(orcadoCell.props.className).toContain('text-right');
    expect(orcadoCell.props.className).toContain('tabular-nums');
    const [orcadoValueSpan, orcadoEditBtn] = orcadoCell.props.children[0].props.children;
    expect(orcadoValueSpan.props.children).toBe('R$ 1000,00');
    // Pencil button appears only on hover
    expect(orcadoEditBtn.props.className).toContain('opacity-0');
    expect(orcadoEditBtn.props.className).toContain('group-hover:opacity-100');

    // Check Gasto cell
    expect(gastoCell.props.className).toContain('text-right');
    expect(gastoCell.props.children.props.children).toBe('R$ 300,00');

    // Check Restante cell
    expect(restanteCell.props.className).toContain('text-right');
    expect(restanteCell.props.children.props.children).toBe('R$ 700,00');
  });

  it('subcategories also have consistent behavior (text-right, pencil on hover, Definir link when 0)', () => {
    const subElement = BudgetRow({
      ...defaultProps,
      parentCategoryId: 'cat-parent',
      plannedAmount: 0,
      realizedAmount: 0,
    });

    expect(subElement.props.className).toContain('group');
    const cells = subElement.props.children;
    const orcadoCell = cells[1];
    const gastoCell = cells[2];
    const restanteCell = cells[3];

    expect(orcadoCell.props.className).toContain('text-right');
    expect(orcadoCell.props.className).toContain('tabular-nums');
    expect(orcadoCell.props.children[0].props.children.props.children).toBe('Definir');

    expect(gastoCell.props.className).toContain('text-right');
    expect(gastoCell.props.children.props.children).toBe('—');

    expect(restanteCell.props.className).toContain('text-right');
    expect(restanteCell.props.children.props.children).toBe('—');
  });
});
