import { describe, expect, it, vi } from 'vitest';
import {
  TransactionType,
  TransactionStatus,
  TransactionVisibility,
  Transaction,
  Category,
} from '../types';
import { Account } from '../../accounts/types';
import {
  transactionSchema,
  RepetitionType,
  RecurrenceRule,
} from '../schemas/transactionSchema';

// Mock react hooks since vitest runs in a pure node environment
vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useState: (initial: unknown) => [
      typeof initial === 'function' ? (initial as () => unknown)() : initial,
      vi.fn(),
    ],
    useRef: (initial: unknown) => ({ current: initial ?? null }),
    useEffect: vi.fn(),
    useCallback: (fn: unknown) => fn,
    useLayoutEffect: vi.fn(),
  };
});

let mockedEditingTx: Transaction | null = null;

vi.mock('react-hook-form', () => ({
  useForm: () => ({
    register: (name: string) => ({ name, onChange: vi.fn(), onBlur: vi.fn(), ref: vi.fn() }),
    handleSubmit: (fn: unknown) => fn,
    watch: (fieldName?: string) => {
      if (fieldName === 'type') {
        return mockedEditingTx?.type || TransactionType.EXPENSE;
      }
      if (fieldName === 'visibility') {
        return mockedEditingTx?.visibility || TransactionVisibility.PERSONAL;
      }
      if (fieldName === 'accountId') {
        return mockedEditingTx?.accountId || 'acc-checking-1';
      }
      if (fieldName === 'categoryId') {
        return mockedEditingTx?.categoryId || '';
      }
      return undefined;
    },
    setValue: vi.fn(),
    reset: vi.fn(),
    control: {},
    clearErrors: vi.fn(),
    formState: { errors: {} },
  }),
  Controller: ({ name, render }: { name: string; render: (props: unknown) => unknown }) =>
    render({
      field: {
        name,
        value: mockedEditingTx?.amount || 0,
        onChange: vi.fn(),
        onBlur: vi.fn(),
        ref: vi.fn(),
      },
      fieldState: { error: undefined },
    }),
}));

import { TransactionFormModal } from './TransactionFormModal';

describe('TransactionFormModal (UX-15 — TransactionFormModal: esqueleto)', () => {
  const dummyAccounts: Account[] = [
    {
      id: 'acc-checking-1',
      userId: 'user-1',
      name: 'Conta Corrente',
      type: 'CHECKING',
      bank: 'Nubank',
      balance: 1000,
      status: 'ACTIVE',
    },
    {
      id: 'acc-card-1',
      userId: 'user-1',
      name: 'Cartão de Crédito',
      type: 'CREDIT_CARD',
      bank: 'Nubank',
      balance: 0,
      creditLimit: 5000,
      closingDay: 20,
      dueDay: 27,
      status: 'ACTIVE',
    },
  ];

  const dummyCategories: Category[] = [
    {
      id: 'cat-exp-root',
      name: 'Alimentação',
      parentId: null,
      visibility: TransactionVisibility.PERSONAL,
    },
    {
      id: 'cat-exp-sub',
      name: 'Supermercado',
      parentId: 'cat-exp-root',
      visibility: TransactionVisibility.PERSONAL,
    },
    {
      id: 'cat-inc-root',
      name: 'Receitas',
      parentId: null,
      visibility: TransactionVisibility.PERSONAL,
    },
    {
      id: 'cat-inc-sub',
      name: 'Salário',
      parentId: 'cat-inc-root',
      visibility: TransactionVisibility.PERSONAL,
    },
  ];

  const dummyEditingTransaction: Transaction = {
    id: 'tx-1',
    userId: 'user-1',
    accountId: 'acc-checking-1',
    categoryId: 'cat-exp-sub',
    description: 'Compras do mês',
    amount: 250.75,
    type: TransactionType.EXPENSE,
    competenceDate: '2026-10-01',
    dueDate: '2026-10-15',
    paymentDate: null,
    status: TransactionStatus.PENDING,
    visibility: TransactionVisibility.PERSONAL,
    isRecurring: false,
  };

  it('returns null when isOpen is false', () => {
    mockedEditingTx = null;
    const element = TransactionFormModal({
      isOpen: false,
      onClose: vi.fn(),
      editingTransaction: null,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    expect(element).toBeNull();
  });

  it('renders "Novo lançamento" title and 40x40 close button with aria-label="Fechar"', () => {
    mockedEditingTx = null;
    const element = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: null,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    expect(element).toBeDefined();

    // Modal card container
    const modalContent = element?.props.children;
    const [header] = modalContent.props.children;

    // Header title and close button
    const [title, closeBtn] = header.props.children;
    expect(title.props.children).toBe('Novo lançamento');

    // Close button specifications: 40x40 (w-10 h-10) and aria-label="Fechar"
    expect(closeBtn.props['aria-label']).toBe('Fechar');
    expect(closeBtn.props.className).toContain('w-10');
    expect(closeBtn.props.className).toContain('h-10');
  });

  it('renders "Editar lançamento" title when editingTransaction is passed', () => {
    mockedEditingTx = dummyEditingTransaction;
    const element = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: dummyEditingTransaction,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    expect(element).toBeDefined();
    const modalContent = element?.props.children;
    const [header] = modalContent.props.children;
    const [title] = header.props.children;

    expect(title.props.children).toBe('Editar lançamento');
  });

  it('renders segmented selector "Despesa" | "Receita" with 44px buttons and design tokens', () => {
    mockedEditingTx = null;
    const element = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: null,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    const modalContent = element?.props.children;
    const [, form] = modalContent.props.children;

    // Form elements: [transFormError, segmentedControl, controller(amount), input(description), select(category), footer]
    const formChildren = form.props.children;
    const segmentedControl = formChildren[1];

    expect(segmentedControl.props.className).toContain('bg-bg-base');
    expect(segmentedControl.props.className).toContain('rounded-xl');
    expect(segmentedControl.props.className).toContain('p-1'); // 4px padding

    const [expenseBtn, incomeBtn] = segmentedControl.props.children;

    // Despesa button
    expect(expenseBtn.props.children).toBe('Despesa');
    expect(expenseBtn.props.className).toContain('h-11'); // 44px
    expect(expenseBtn.props.className).toContain('bg-danger/15');
    expect(expenseBtn.props.className).toContain('text-danger');

    // Receita button (inactive when default is expense)
    expect(incomeBtn.props.children).toBe('Receita');
    expect(incomeBtn.props.className).toContain('h-11'); // 44px
    expect(incomeBtn.props.className).toContain('bg-transparent');
    expect(incomeBtn.props.className).toContain('text-text-muted');
  });

  it('renders Description input with placeholder "Ex.: Supermercado, aluguel"', () => {
    mockedEditingTx = null;
    const element = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: null,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    const modalContent = element?.props.children;
    const [, form] = modalContent.props.children;
    const formChildren = form.props.children;

    const descriptionInput = formChildren[3];
    expect(descriptionInput.props.label).toBe('Descrição');
    expect(descriptionInput.props.placeholder).toBe('Ex.: Supermercado, aluguel');
  });

  it('renders footer with Cancelar, Salvar e adicionar outro, and Salvar buttons with primary brand color', () => {
    mockedEditingTx = null;
    const element = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: null,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    const modalContent = element?.props.children;
    const [, form] = modalContent.props.children;
    const formChildren = form.props.children;

    const footer = formChildren[5];
    const [cancelBtn, saveAndAddAnotherBtn, saveBtn] = footer.props.children;

    // Cancelar
    expect(cancelBtn.props.children).toBe('Cancelar');
    expect(cancelBtn.props.variant).toBe('ghost');

    // Salvar e adicionar outro (outline, shown on create mode)
    expect(saveAndAddAnotherBtn).toBeDefined();
    expect(saveAndAddAnotherBtn.props.children).toBe('Salvar e adicionar outro');
    expect(saveAndAddAnotherBtn.props.variant).toBe('secondary');
    expect(saveAndAddAnotherBtn.props.className).toContain('border-border-subtle');

    // Salvar
    expect(saveBtn.props.children).toBe('Salvar');
    expect(saveBtn.props.className).toContain('bg-brand');
    expect(saveBtn.props.className).toContain('hover:bg-brand-hover');
  });

  it('hides "Salvar e adicionar outro" when editingTransaction is present', () => {
    mockedEditingTx = dummyEditingTransaction;
    const element = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: dummyEditingTransaction,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    const modalContent = element?.props.children;
    const [, form] = modalContent.props.children;
    const formChildren = form.props.children;

    const footer = formChildren[5];
    const [cancelBtn, saveAndAddAnotherBtn, saveBtn] = footer.props.children;

    expect(cancelBtn.props.children).toBe('Cancelar');
    expect(saveAndAddAnotherBtn).toBeFalsy();
    expect(saveBtn.props.children).toBe('Salvar');
  });

  it('preserves field positions between expense and income modes', () => {
    mockedEditingTx = null;
    // Expense element
    const expenseEl = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: null,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    mockedEditingTx = {
      ...dummyEditingTransaction,
      type: TransactionType.INCOME,
    };
    // Income element (via editingTransaction with type = INCOME)
    const incomeEl = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: mockedEditingTx,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    const expenseFormChildren = expenseEl?.props.children.props.children[1].props.children;
    const incomeFormChildren = incomeEl?.props.children.props.children[1].props.children;

    // Both forms have the same number of visible children in the exact same positions
    expect(expenseFormChildren.length).toBe(incomeFormChildren.length);
    // Position 1: Segmented control
    expect(expenseFormChildren[1].props.className).toContain('grid-cols-2');
    expect(incomeFormChildren[1].props.className).toContain('grid-cols-2');
    // Position 2: CurrencyInput Controller
    expect(expenseFormChildren[2].props.name).toBe('amount');
    expect(incomeFormChildren[2].props.name).toBe('amount');
    // Position 3: Description Input
    expect(expenseFormChildren[3].props.label).toBe('Descrição');
    expect(incomeFormChildren[3].props.label).toBe('Descrição');
    // Position 4: Category Select
    expect(expenseFormChildren[4].props.label).toBe('Categoria');
    expect(incomeFormChildren[4].props.label).toBe('Categoria');
  });

  it('validates created transaction payload against transactionSchema without changes to payload structure', () => {
    const validExpensePayload = {
      type: TransactionType.EXPENSE,
      amount: 150.5,
      description: 'Supermercado Mensal',
      accountId: 'acc-checking-1',
      categoryId: 'cat-exp-sub',
      dueDate: '2026-10-11',
      competenceDate: '',
      paymentDate: '',
      status: TransactionStatus.PENDING,
      visibility: TransactionVisibility.PERSONAL,
      repetitionType: RepetitionType.SINGLE,
      totalInstallments: null,
      isRecurring: false,
      recurrenceRule: RecurrenceRule.MONTHLY,
    };

    const parsed = transactionSchema.safeParse(validExpensePayload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.type).toBe(TransactionType.EXPENSE);
      expect(parsed.data.amount).toBe(150.5);
      expect(parsed.data.description).toBe('Supermercado Mensal');
      expect(parsed.data.status).toBe(TransactionStatus.PENDING);
      expect(parsed.data.visibility).toBe(TransactionVisibility.PERSONAL);
    }
  });

  it('validates income transaction payload against transactionSchema', () => {
    const validIncomePayload = {
      type: TransactionType.INCOME,
      amount: 4500,
      description: 'Salário',
      accountId: 'acc-checking-1',
      categoryId: 'cat-inc-sub',
      dueDate: '2026-10-11',
      competenceDate: '',
      paymentDate: '',
      status: TransactionStatus.PENDING,
      visibility: TransactionVisibility.PERSONAL,
      repetitionType: RepetitionType.SINGLE,
      totalInstallments: null,
      isRecurring: false,
      recurrenceRule: RecurrenceRule.MONTHLY,
    };

    const parsed = transactionSchema.safeParse(validIncomePayload);
    expect(parsed.success).toBe(true);
  });
});
