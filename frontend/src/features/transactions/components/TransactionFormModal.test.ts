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
let mockedWatchOverrides: Record<string, unknown> = {};
let mockedCoupleStatus: { status: string } = { status: 'NONE' };
const mockedSetValue = vi.fn();
const mockedReset = vi.fn();

vi.mock('../../couple/hooks/useCouple', () => ({
  useCouple: () => ({
    coupleStatus: mockedCoupleStatus,
  }),
}));

vi.mock('react-hook-form', () => ({
  useForm: () => ({
    register: (name: string) => ({ name, onChange: vi.fn(), onBlur: vi.fn(), ref: vi.fn() }),
    handleSubmit: (fn: (data: unknown) => unknown) => (dataOrEvent?: unknown) => {
      if (typeof fn === 'function') {
        const payload = dataOrEvent || {
          type: mockedEditingTx?.type || TransactionType.EXPENSE,
          amount: mockedEditingTx?.amount || 100,
          description: mockedEditingTx?.description || 'Teste',
          accountId: mockedEditingTx?.accountId || 'acc-checking-1',
          categoryId: mockedEditingTx?.categoryId || 'cat-exp-sub',
          dueDate: mockedEditingTx?.dueDate || '2026-10-11',
          competenceDate: mockedEditingTx?.competenceDate ? mockedEditingTx.competenceDate.slice(0, 7) : '',
          paymentDate: mockedEditingTx?.paymentDate || '',
          status: mockedEditingTx?.status || TransactionStatus.PENDING,
          visibility: mockedEditingTx?.visibility || TransactionVisibility.PERSONAL,
          repetitionType: RepetitionType.SINGLE,
          totalInstallments: null,
          isRecurring: false,
          recurrenceRule: RecurrenceRule.MONTHLY,
        };
        return fn(payload);
      }
      return undefined;
    },
    watch: (fieldName?: string) => {
      if (fieldName && fieldName in mockedWatchOverrides) {
        return mockedWatchOverrides[fieldName];
      }
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
      if (fieldName === 'totalInstallments') {
        return mockedEditingTx?.totalInstallments ?? null;
      }
      if (fieldName === 'dueDate') {
        return mockedEditingTx?.dueDate || '2026-10-11';
      }
      if (fieldName === 'competenceDate') {
        return mockedEditingTx?.competenceDate ? mockedEditingTx.competenceDate.slice(0, 7) : '';
      }
      if (fieldName === 'repetitionType') {
        return mockedEditingTx?.totalInstallments && mockedEditingTx.totalInstallments > 1
          ? RepetitionType.INSTALLMENT
          : RepetitionType.SINGLE;
      }
      return undefined;
    },
    setValue: (...args: unknown[]) => mockedSetValue(...args),
    reset: (...args: unknown[]) => mockedReset(...args),
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
import { hasNonDefaultDetails } from '../utils/transactionDetails';

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

    const footer = formChildren[formChildren.length - 1];
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

    const footer = formChildren[formChildren.length - 1];
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

describe('TransactionFormModal (UX-16 — Modal: "Pago com" e parcelas)', () => {
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
      name: 'Nubank Ultravioleta',
      type: 'CREDIT_CARD',
      bank: 'Nubank',
      balance: 0,
      creditLimit: 5000,
      closingDay: 20,
      dueDay: 27,
      status: 'ACTIVE',
    },
  ];

  const dummyMultipleCardsAccounts: Account[] = [
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
      name: 'Nubank Ultravioleta',
      type: 'CREDIT_CARD',
      bank: 'Nubank',
      balance: 0,
      creditLimit: 5000,
      closingDay: 20,
      dueDay: 27,
      status: 'ACTIVE',
    },
    {
      id: 'acc-card-2',
      userId: 'user-1',
      name: 'Itaú Uniclass Black',
      type: 'CREDIT_CARD',
      bank: 'Itaú',
      balance: 0,
      creditLimit: 15000,
      closingDay: 3,
      dueDay: 10,
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

  it('renders SectionLabel with "Pago com" in expense mode and "Recebido em" in income mode', () => {
    mockedEditingTx = null;
    mockedWatchOverrides = {};

    const expenseEl = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: null,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    const expenseForm = expenseEl?.props.children.props.children[1];
    const expensePagoComSection = expenseForm.props.children[5];
    const expenseSectionLabel = expensePagoComSection.props.children[0];
    expect(expenseSectionLabel.props.children).toBe('Pago com');

    mockedEditingTx = {
      id: 'tx-inc',
      userId: 'user-1',
      accountId: 'acc-checking-1',
      categoryId: 'cat-inc-sub',
      description: 'Salário',
      amount: 5000,
      type: TransactionType.INCOME,
      competenceDate: '2026-10-01',
      dueDate: '2026-10-11',
      paymentDate: null,
      status: TransactionStatus.PENDING,
      visibility: TransactionVisibility.PERSONAL,
      isRecurring: false,
    };

    const incomeEl = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: mockedEditingTx,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    const incomeForm = incomeEl?.props.children.props.children[1];
    const incomePagoComSection = incomeForm.props.children[5];
    const incomeSectionLabel = incomePagoComSection.props.children[0];
    expect(incomeSectionLabel.props.children).toBe('Recebido em');
  });

  it('renders 44px rounded-xl chips for active checking accounts and credit card in expense mode', () => {
    mockedEditingTx = null;
    mockedWatchOverrides = { accountId: 'acc-checking-1' };

    const element = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: null,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    const form = element?.props.children.props.children[1];
    const pagoComSection = form.props.children[5];
    // In fragment: children[1] is <> [chipsContainer, errors, cardOptions] </>
    const fragmentChildren = pagoComSection.props.children[1].props.children;
    const chipsContainer = fragmentChildren[0];
    const checkingChips = chipsContainer.props.children[0];
    const checkingChip = checkingChips[0];
    const cardChip = chipsContainer.props.children[1];

    // Checking chip: selected
    expect(checkingChip.props.children).toBe('Conta Corrente');
    expect(checkingChip.props.className).toContain('h-11');
    expect(checkingChip.props.className).toContain('rounded-xl');
    expect(checkingChip.props.className).toContain('border-brand');
    expect(checkingChip.props.className).toContain('bg-brand/15');
    expect(checkingChip.props.className).toContain('text-text-primary');

    // Card chip: not selected
    expect(cardChip.props.children).toBe('Cartão de crédito');
    expect(cardChip.props.className).toContain('h-11');
    expect(cardChip.props.className).toContain('rounded-xl');
    expect(cardChip.props.className).toContain('border-border-subtle');
    expect(cardChip.props.className).toContain('bg-bg-surface');
    expect(cardChip.props.className).toContain('text-text-muted');
  });

  it('does not render "Cartão de crédito" chip in income mode', () => {
    mockedEditingTx = {
      id: 'tx-inc',
      userId: 'user-1',
      accountId: 'acc-checking-1',
      categoryId: 'cat-inc-sub',
      description: 'Salário',
      amount: 5000,
      type: TransactionType.INCOME,
      competenceDate: '2026-10-01',
      dueDate: '2026-10-11',
      paymentDate: null,
      status: TransactionStatus.PENDING,
      visibility: TransactionVisibility.PERSONAL,
      isRecurring: false,
    };
    mockedWatchOverrides = {};

    const element = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: mockedEditingTx,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    const form = element?.props.children.props.children[1];
    const pagoComSection = form.props.children[5];
    const fragmentChildren = pagoComSection.props.children[1].props.children;
    const chipsContainer = fragmentChildren[0];
    const checkingChips = chipsContainer.props.children[0];
    const cardChip = chipsContainer.props.children[1];

    // Only non-card accounts appear
    expect(checkingChips[0].props.children).toBe('Conta Corrente');
    expect(cardChip).toBeFalsy();
  });

  it('shows credit card Select when credit card is selected and there are multiple credit cards', () => {
    mockedEditingTx = null;
    mockedWatchOverrides = { accountId: 'acc-card-1' };

    const element = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: null,
      accounts: dummyMultipleCardsAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    const form = element?.props.children.props.children[1];
    const pagoComSection = form.props.children[5];
    const fragmentChildren = pagoComSection.props.children[1].props.children;
    const cardOptions = fragmentChildren[2]; // isCardSelected && ...

    expect(cardOptions).toBeDefined();
    const [cardSelect, parcelsBlock] = cardOptions.props.children;

    // Select should be rendered because there are 2 credit cards
    expect(cardSelect).toBeDefined();
    expect(cardSelect.props['aria-label']).toBe('Selecionar cartão de crédito');
    expect(cardSelect.props.children.length).toBe(2);

    expect(parcelsBlock).toBeDefined();
  });

  it('does not render credit card Select when there is only one credit card', () => {
    mockedEditingTx = null;
    mockedWatchOverrides = { accountId: 'acc-card-1' };

    const element = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: null,
      accounts: dummyAccounts, // only 1 credit card
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    const form = element?.props.children.props.children[1];
    const pagoComSection = form.props.children[5];
    const fragmentChildren = pagoComSection.props.children[1].props.children;
    const cardOptions = fragmentChildren[2];

    expect(cardOptions).toBeDefined();
    const [cardSelect, parcelsBlock] = cardOptions.props.children;

    // Select is not rendered
    expect(cardSelect).toBeFalsy();
    // Parcels block is rendered
    expect(parcelsBlock).toBeDefined();
  });

  it('renders "Parcelas" block with 14px semibold label and 12px muted invoice month text', () => {
    mockedEditingTx = null;
    mockedWatchOverrides = {
      accountId: 'acc-card-1',
      dueDate: '2026-10-15',
      totalInstallments: null,
    };

    const element = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: null,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    const form = element?.props.children.props.children[1];
    const pagoComSection = form.props.children[5];
    const fragmentChildren = pagoComSection.props.children[1].props.children;
    const cardOptions = fragmentChildren[2];
    const [, parcelsBlock] = cardOptions.props.children;

    const [leftSide, rightSide] = parcelsBlock.props.children;

    // Left side: Parcelas + Entra na fatura de {mês}
    const [title, invoiceMonth] = leftSide.props.children;
    expect(title.props.children).toBe('Parcelas');
    expect(title.props.className).toContain('text-sm');
    expect(title.props.className).toContain('font-semibold');

    // Due date 2026-10-15 is <= closingDay (20), so invoice is current month (outubro)
    expect(invoiceMonth.props.children).toBe('Entra na fatura de outubro');
    expect(invoiceMonth.props.className).toContain('text-xs');
    expect(invoiceMonth.props.className).toContain('text-text-muted');

    // Right side: stepper buttons '−', '1x', '+'
    const [minusBtn, countDisplay, plusBtn] = rightSide.props.children;
    expect(minusBtn.props['aria-label']).toBe('Menos uma parcela');
    expect(minusBtn.props.disabled).toBe(true);
    expect(minusBtn.props.className).toContain('w-11');
    expect(minusBtn.props.className).toContain('h-11');

    expect(countDisplay.props.children).toBe('1x');

    expect(plusBtn.props['aria-label']).toBe('Mais uma parcela');
    expect(plusBtn.props.disabled).toBe(false);
    expect(plusBtn.props.className).toContain('w-11');
    expect(plusBtn.props.className).toContain('h-11');
  });

  it('calculates invoice month for next month when transaction date is after closing day', () => {
    mockedEditingTx = null;
    // Nubank closingDay is 20; transaction date is 25/Oct (after closing day)
    mockedWatchOverrides = {
      accountId: 'acc-card-1',
      dueDate: '2026-10-25',
    };

    const element = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: null,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    const form = element?.props.children.props.children[1];
    const pagoComSection = form.props.children[5];
    const fragmentChildren = pagoComSection.props.children[1].props.children;
    const cardOptions = fragmentChildren[2];
    const [, parcelsBlock] = cardOptions.props.children;
    const [leftSide] = parcelsBlock.props.children;
    const [, invoiceMonth] = leftSide.props.children;

    expect(invoiceMonth.props.children).toBe('Entra na fatura de novembro');
  });

  it('shows "Entra na próxima fatura" when credit card has no closing day', () => {
    mockedEditingTx = null;
    const cardWithoutClosing: Account[] = [
      {
        ...dummyAccounts[1],
        closingDay: null,
      },
    ];
    mockedWatchOverrides = {
      accountId: 'acc-card-1',
      dueDate: '2026-10-15',
    };

    const element = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: null,
      accounts: cardWithoutClosing,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    const form = element?.props.children.props.children[1];
    const pagoComSection = form.props.children[5];
    const fragmentChildren = pagoComSection.props.children[1].props.children;
    const cardOptions = fragmentChildren[2];
    const [, parcelsBlock] = cardOptions.props.children;
    const [leftSide] = parcelsBlock.props.children;
    const [, invoiceMonth] = leftSide.props.children;

    expect(invoiceMonth.props.children).toBe('Entra na próxima fatura');
  });

  it('shows "Cadastre uma conta" with link to /accounts when no accounts are available', () => {
    mockedEditingTx = null;
    mockedWatchOverrides = {};

    const element = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: null,
      accounts: [],
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    const form = element?.props.children.props.children[1];
    const pagoComSection = form.props.children[5];
    const linkContainer = pagoComSection.props.children[1];
    const link = linkContainer.props.children;

    expect(link.props.to).toBe('/accounts');
    expect(link.props.children).toBe('Cadastre uma conta');
  });

  it('opens with credit card chip selected and correct installments in edit mode', () => {
    mockedEditingTx = {
      id: 'tx-installment',
      userId: 'user-1',
      accountId: 'acc-card-1',
      categoryId: 'cat-exp-sub',
      description: 'Notebook parcelado',
      amount: 3600,
      type: TransactionType.EXPENSE,
      competenceDate: '2026-10-01',
      dueDate: '2026-10-15',
      paymentDate: null,
      status: TransactionStatus.PENDING,
      visibility: TransactionVisibility.PERSONAL,
      installmentGroupId: 'grp-123',
      totalInstallments: 6,
      isRecurring: false,
    };
    mockedWatchOverrides = {};

    const element = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: mockedEditingTx,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    const form = element?.props.children.props.children[1];
    const pagoComSection = form.props.children[5];
    const fragmentChildren = pagoComSection.props.children[1].props.children;

    // Chips: Card chip is selected
    const chipsContainer = fragmentChildren[0];
    const cardChip = chipsContainer.props.children[1];
    expect(cardChip.props.children).toBe('Cartão de crédito');
    expect(cardChip.props.className).toContain('border-brand');
    expect(cardChip.props.className).toContain('bg-brand/15');

    // Stepper: displays 6x and minus button is enabled
    const cardOptions = fragmentChildren[2];
    const [, parcelsBlock] = cardOptions.props.children;
    const [, rightSide] = parcelsBlock.props.children;
    const [minusBtn, countDisplay] = rightSide.props.children;

    expect(countDisplay.props.children).toBe('6x');
    expect(minusBtn.props.disabled).toBe(false);
  });
});

describe('TransactionFormModal (UX-17 — Modal: data e status de pagamento)', () => {
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
      name: 'Nubank Ultravioleta',
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

  const getTodayStr = () => {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  };

  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  };

  it('renders SectionLabel with "Data" in expense and income modes, and "Data da compra" when credit card is selected', () => {
    mockedEditingTx = null;
    mockedWatchOverrides = { accountId: 'acc-checking-1' };

    // 1. Normal expense
    const expenseEl = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: null,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    const expenseForm = expenseEl?.props.children.props.children[1];
    const expenseDataSection = expenseForm.props.children[6];
    const expenseLabel = expenseDataSection.props.children[0];
    expect(expenseLabel.props.children).toBe('Data');

    // 2. Income
    mockedEditingTx = {
      id: 'tx-inc',
      userId: 'user-1',
      accountId: 'acc-checking-1',
      categoryId: 'cat-inc-sub',
      description: 'Salário',
      amount: 5000,
      type: TransactionType.INCOME,
      competenceDate: '2026-10-01',
      dueDate: getTodayStr(),
      paymentDate: null,
      status: TransactionStatus.PENDING,
      visibility: TransactionVisibility.PERSONAL,
      isRecurring: false,
    };
    mockedWatchOverrides = {};

    const incomeEl = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: mockedEditingTx,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    const incomeForm = incomeEl?.props.children.props.children[1];
    const incomeDataSection = incomeForm.props.children[6];
    const incomeLabel = incomeDataSection.props.children[0];
    expect(incomeLabel.props.children).toBe('Data');

    // 3. Credit Card expense
    mockedEditingTx = null;
    mockedWatchOverrides = { accountId: 'acc-card-1' };

    const cardEl = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: null,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    const cardForm = cardEl?.props.children.props.children[1];
    const cardDataSection = cardForm.props.children[6];
    const cardLabel = cardDataSection.props.children[0];
    expect(cardLabel.props.children).toBe('Data da compra');
  });

  it('renders date chips "Hoje", "Ontem" and "Outra data" with 44px height and rounded-xl', () => {
    mockedEditingTx = null;
    mockedWatchOverrides = {};

    const element = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: null,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    const form = element?.props.children.props.children[1];
    const dataSection = form.props.children[6];
    const chipsContainer = dataSection.props.children[1];
    const [hojeBtn, ontemBtn, outraDataBtn] = chipsContainer.props.children;

    // Hoje button (selected by default)
    expect(hojeBtn.props.children).toBe('Hoje');
    expect(hojeBtn.props.className).toContain('h-11');
    expect(hojeBtn.props.className).toContain('rounded-xl');
    expect(hojeBtn.props.className).toContain('border-brand');
    expect(hojeBtn.props.className).toContain('bg-brand/15');
    expect(hojeBtn.props.className).toContain('text-text-primary');

    // Ontem button
    expect(ontemBtn.props.children).toBe('Ontem');
    expect(ontemBtn.props.className).toContain('h-11');
    expect(ontemBtn.props.className).toContain('rounded-xl');
    expect(ontemBtn.props.className).toContain('border-border-subtle');
    expect(ontemBtn.props.className).toContain('bg-bg-surface');
    expect(ontemBtn.props.className).toContain('text-text-muted');

    // Outra data button
    expect(outraDataBtn.props.children).toBe('Outra data');
    expect(outraDataBtn.props.className).toContain('h-11');
    expect(outraDataBtn.props.className).toContain('rounded-xl');
    expect(outraDataBtn.props.className).toContain('border-border-subtle');
    expect(outraDataBtn.props.className).toContain('bg-bg-surface');
    expect(outraDataBtn.props.className).toContain('text-text-muted');
  });

  it('does not render date input when "Hoje" or "Ontem" is selected', () => {
    mockedEditingTx = null;
    mockedWatchOverrides = {};

    const element = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: null,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    const form = element?.props.children.props.children[1];
    const dataSection = form.props.children[6];
    const customDateInput = dataSection.props.children[3];

    expect(customDateInput).toBeFalsy();
  });

  it('renders date input with [color-scheme:dark] and aria-label="Outra data" when editing transaction with custom date', () => {
    mockedEditingTx = {
      id: 'tx-custom-date',
      userId: 'user-1',
      accountId: 'acc-checking-1',
      categoryId: 'cat-exp-sub',
      description: 'Lançamento data personalizada',
      amount: 150,
      type: TransactionType.EXPENSE,
      competenceDate: '2026-10-01',
      dueDate: '2026-10-05',
      paymentDate: null,
      status: TransactionStatus.PENDING,
      visibility: TransactionVisibility.PERSONAL,
      isRecurring: false,
    };
    mockedWatchOverrides = { dueDate: '2026-10-05' };

    const element = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: mockedEditingTx,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    const form = element?.props.children.props.children[1];
    const dataSection = form.props.children[6];
    const chipsContainer = dataSection.props.children[1];
    const [, , outraDataBtn] = chipsContainer.props.children;

    // Outra data chip is selected
    expect(outraDataBtn.props.className).toContain('border-brand');
    expect(outraDataBtn.props.className).toContain('bg-brand/15');

    // Date input is rendered
    const customDateInput = dataSection.props.children[3];
    expect(customDateInput).toBeDefined();
    expect(customDateInput.props.type).toBe('date');
    expect(customDateInput.props['aria-label']).toBe('Outra data');
    expect(customDateInput.props.className).toContain('[color-scheme:dark]');
    expect(customDateInput.props.value).toBe('2026-10-05');
  });

  it('selects "Ontem" chip when editing transaction with yesterday date', () => {
    const yesterday = getYesterdayStr();
    mockedEditingTx = {
      id: 'tx-yesterday',
      userId: 'user-1',
      accountId: 'acc-checking-1',
      categoryId: 'cat-exp-sub',
      description: 'Lançamento de ontem',
      amount: 80,
      type: TransactionType.EXPENSE,
      competenceDate: '2026-10-01',
      dueDate: yesterday,
      paymentDate: yesterday,
      status: TransactionStatus.PAID,
      visibility: TransactionVisibility.PERSONAL,
      isRecurring: false,
    };
    mockedWatchOverrides = { dueDate: yesterday };

    const element = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: mockedEditingTx,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    const form = element?.props.children.props.children[1];
    const dataSection = form.props.children[6];
    const chipsContainer = dataSection.props.children[1];
    const [, ontemBtn] = chipsContainer.props.children;

    expect(ontemBtn.props.className).toContain('border-brand');
    expect(ontemBtn.props.className).toContain('bg-brand/15');

    // Date input should not be open
    const customDateInput = dataSection.props.children[3];
    expect(customDateInput).toBeFalsy();
  });

  it('renders Switch "Já foi pago" for expense and "Já foi recebido" for income', () => {
    // Expense
    mockedEditingTx = null;
    mockedWatchOverrides = { accountId: 'acc-checking-1' };

    const expenseEl = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: null,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    const expenseForm = expenseEl?.props.children.props.children[1];
    const expenseDataSection = expenseForm.props.children[6];
    const expenseSwitchContainer = expenseDataSection.props.children[4];
    const [expenseSwitchLabel, expenseSwitchBtn] = expenseSwitchContainer.props.children;

    expect(expenseSwitchLabel.props.children).toBe('Já foi pago');
    expect(expenseSwitchBtn.props.role).toBe('switch');
    expect(expenseSwitchBtn.props['aria-label']).toBe('Já foi pago');

    // Income
    mockedEditingTx = {
      id: 'tx-inc',
      userId: 'user-1',
      accountId: 'acc-checking-1',
      categoryId: 'cat-inc-sub',
      description: 'Salário',
      amount: 5000,
      type: TransactionType.INCOME,
      competenceDate: '2026-10-01',
      dueDate: getTodayStr(),
      paymentDate: null,
      status: TransactionStatus.PENDING,
      visibility: TransactionVisibility.PERSONAL,
      isRecurring: false,
    };
    mockedWatchOverrides = {};

    const incomeEl = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: mockedEditingTx,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    const incomeForm = incomeEl?.props.children.props.children[1];
    const incomeDataSection = incomeForm.props.children[6];
    const incomeSwitchContainer = incomeDataSection.props.children[4];
    const [incomeSwitchLabel, incomeSwitchBtn] = incomeSwitchContainer.props.children;

    expect(incomeSwitchLabel.props.children).toBe('Já foi recebido');
    expect(incomeSwitchBtn.props.role).toBe('switch');
    expect(incomeSwitchBtn.props['aria-label']).toBe('Já foi recebido');
  });

  it('switch defaults to ON (aria-checked=true) for new transaction of today', () => {
    mockedEditingTx = null;
    mockedWatchOverrides = { accountId: 'acc-checking-1' };

    const element = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: null,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    const form = element?.props.children.props.children[1];
    const dataSection = form.props.children[6];
    const switchContainer = dataSection.props.children[4];
    const [, switchBtn] = switchContainer.props.children;

    expect(switchBtn.props['aria-checked']).toBe(true);
    expect(switchBtn.props.className).toContain('bg-brand');
  });

  it('does not render switch "Já foi pago" when credit card is selected', () => {
    mockedEditingTx = null;
    mockedWatchOverrides = { accountId: 'acc-card-1' };

    const element = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: null,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    const form = element?.props.children.props.children[1];
    const dataSection = form.props.children[6];
    const switchContainer = dataSection.props.children[4];

    expect(switchContainer).toBeFalsy();
  });

  it('opens with switch OFF (aria-checked=false) when editing an unpaid transaction', () => {
    mockedEditingTx = {
      id: 'tx-unpaid',
      userId: 'user-1',
      accountId: 'acc-checking-1',
      categoryId: 'cat-exp-sub',
      description: 'Conta de luz pendente',
      amount: 120,
      type: TransactionType.EXPENSE,
      competenceDate: '2026-10-01',
      dueDate: getTodayStr(),
      paymentDate: null,
      status: TransactionStatus.PENDING,
      visibility: TransactionVisibility.PERSONAL,
      isRecurring: false,
    };
    mockedWatchOverrides = {};

    const element = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: mockedEditingTx,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    const form = element?.props.children.props.children[1];
    const dataSection = form.props.children[6];
    const switchContainer = dataSection.props.children[4];
    const [, switchBtn] = switchContainer.props.children;

    expect(switchBtn.props['aria-checked']).toBe(false);
  });

  it('opens with switch ON (aria-checked=true) when editing a paid transaction', () => {
    const today = getTodayStr();
    mockedEditingTx = {
      id: 'tx-paid',
      userId: 'user-1',
      accountId: 'acc-checking-1',
      categoryId: 'cat-exp-sub',
      description: 'Supermercado pago',
      amount: 250,
      type: TransactionType.EXPENSE,
      competenceDate: '2026-10-01',
      dueDate: today,
      paymentDate: today,
      status: TransactionStatus.PAID,
      visibility: TransactionVisibility.PERSONAL,
      isRecurring: false,
    };
    mockedWatchOverrides = {};

    const element = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: mockedEditingTx,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    const form = element?.props.children.props.children[1];
    const dataSection = form.props.children[6];
    const switchContainer = dataSection.props.children[4];
    const [, switchBtn] = switchContainer.props.children;

    expect(switchBtn.props['aria-checked']).toBe(true);
  });

  it('validates schema when transaction is paid with paymentDate and rejects when paid without paymentDate', () => {
    const today = getTodayStr();
    const validPaidPayload = {
      type: TransactionType.EXPENSE,
      amount: 50,
      description: 'Almoço',
      accountId: 'acc-checking-1',
      categoryId: 'cat-exp-sub',
      dueDate: today,
      paymentDate: today,
      status: TransactionStatus.PAID,
      visibility: TransactionVisibility.PERSONAL,
      repetitionType: RepetitionType.SINGLE,
      totalInstallments: null,
      isRecurring: false,
      recurrenceRule: RecurrenceRule.MONTHLY,
    };

    const validResult = transactionSchema.safeParse(validPaidPayload);
    expect(validResult.success).toBe(true);

    const invalidPaidPayload = {
      ...validPaidPayload,
      paymentDate: '',
    };
    const invalidResult = transactionSchema.safeParse(invalidPaidPayload);
    expect(invalidResult.success).toBe(false);
  });
});

describe('TransactionFormModal (UX-18 — Modal: "Mais detalhes" e casal)', () => {
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
      name: 'Nubank Ultravioleta',
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
      id: 'cat-sys-root',
      userId: null,
      name: 'Alimentação',
      parentId: null,
      visibility: TransactionVisibility.PERSONAL,
    },
    {
      id: 'cat-pers-sub',
      userId: 'user-1',
      name: 'Lanche Pessoal',
      parentId: 'cat-sys-root',
      visibility: TransactionVisibility.PERSONAL,
    },
    {
      id: 'cat-shared-sub',
      userId: 'user-1',
      name: 'Feira Casal',
      parentId: 'cat-sys-root',
      visibility: TransactionVisibility.SHARED,
    },
    {
      id: 'cat-inc-root',
      userId: null,
      name: 'Receitas',
      parentId: null,
      visibility: TransactionVisibility.PERSONAL,
    },
  ];

  const dummyEditingTransaction: Transaction = {
    id: 'tx-1',
    userId: 'user-1',
    accountId: 'acc-checking-1',
    categoryId: 'cat-pers-sub',
    description: 'Compra Simples',
    amount: 100,
    type: TransactionType.EXPENSE,
    competenceDate: '2026-10-01',
    dueDate: '2026-10-15',
    paymentDate: null,
    status: TransactionStatus.PENDING,
    visibility: TransactionVisibility.PERSONAL,
    isRecurring: false,
  };

  it('correctly evaluates hasNonDefaultDetails helper', () => {
    expect(hasNonDefaultDetails(null, dummyAccounts)).toBe(false);

    // Default single transaction with matching competence month
    const defaultTx: Transaction = {
      ...dummyEditingTransaction,
      competenceDate: '2026-10-01',
      dueDate: '2026-10-15',
    };
    expect(hasNonDefaultDetails(defaultTx, dummyAccounts)).toBe(false);

    // Non-default: installment
    expect(
      hasNonDefaultDetails(
        { ...defaultTx, installmentGroupId: 'inst-1', totalInstallments: 3 },
        dummyAccounts
      )
    ).toBe(true);

    // Non-default: recurring
    expect(
      hasNonDefaultDetails(
        { ...defaultTx, isRecurring: true },
        dummyAccounts
      )
    ).toBe(true);

    // Non-default: competence differs from due month
    expect(
      hasNonDefaultDetails(
        { ...defaultTx, competenceDate: '2026-11-01', dueDate: '2026-10-15' },
        dummyAccounts
      )
    ).toBe(true);

    // Credit card: transaction on 2026-10-10 (closingDay 20 -> expected 2026-10)
    const cardTxDefault: Transaction = {
      ...defaultTx,
      accountId: 'acc-card-1',
      dueDate: '2026-10-10',
      competenceDate: '2026-10-01',
    };
    expect(hasNonDefaultDetails(cardTxDefault, dummyAccounts)).toBe(false);

    // Credit card: transaction on 2026-10-25 (closingDay 20 -> expected next month 2026-11)
    const cardTxNextMonth: Transaction = {
      ...defaultTx,
      accountId: 'acc-card-1',
      dueDate: '2026-10-25',
      competenceDate: '2026-11-01',
    };
    expect(hasNonDefaultDetails(cardTxNextMonth, dummyAccounts)).toBe(false);

    // Credit card: competence differs from expected
    const cardTxDiffComp: Transaction = {
      ...defaultTx,
      accountId: 'acc-card-1',
      dueDate: '2026-10-25',
      competenceDate: '2026-12-01',
    };
    expect(hasNonDefaultDetails(cardTxDiffComp, dummyAccounts)).toBe(true);
  });

  it('hides Switch "Compartilhar com o casal" when user has no active couple', () => {
    mockedEditingTx = null;
    mockedWatchOverrides = {};
    mockedCoupleStatus = { status: 'NONE' };

    const element = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: null,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    const form = element?.props.children.props.children[1];
    // child 7 is {hasCouple && ...}
    const coupleSwitchBlock = form.props.children[7];
    expect(coupleSwitchBlock).toBeFalsy();
  });

  it('renders Switch "Compartilhar com o casal" when user has an active couple', () => {
    mockedEditingTx = null;
    mockedWatchOverrides = {};
    mockedCoupleStatus = { status: 'ACTIVE' };

    const element = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: null,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    const form = element?.props.children.props.children[1];
    const coupleSwitchBlock = form.props.children[7];
    expect(coupleSwitchBlock).toBeTruthy();

    const [labelSpan, switchBtn] = coupleSwitchBlock.props.children;
    expect(labelSpan.props.children).toBe('Compartilhar com o casal');
    expect(switchBtn.props['role']).toBe('switch');
    expect(switchBtn.props['aria-checked']).toBe(false);
  });

  it('renders Switch with aria-checked=true when visibility is SHARED and toggles visibility on click', () => {
    mockedEditingTx = null;
    mockedWatchOverrides = { visibility: TransactionVisibility.SHARED };
    mockedCoupleStatus = { status: 'ACTIVE' };
    mockedSetValue.mockClear();

    const element = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: null,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    const form = element?.props.children.props.children[1];
    const coupleSwitchBlock = form.props.children[7];
    const [, switchBtn] = coupleSwitchBlock.props.children;
    expect(switchBtn.props['aria-checked']).toBe(true);

    switchBtn.props.onClick();
    expect(mockedSetValue).toHaveBeenCalledWith(
      'visibility',
      TransactionVisibility.PERSONAL,
      { shouldValidate: true }
    );
  });

  it('clears categoryId when toggling visibility if current category is invalid for the new visibility', () => {
    // Current category is PERSONAL custom category 'cat-pers-sub'
    mockedEditingTx = null;
    mockedWatchOverrides = {
      visibility: TransactionVisibility.PERSONAL,
      categoryId: 'cat-pers-sub',
    };
    mockedCoupleStatus = { status: 'ACTIVE' };
    mockedSetValue.mockClear();

    const element = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: null,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    const form = element?.props.children.props.children[1];
    const coupleSwitchBlock = form.props.children[7];
    const [, switchBtn] = coupleSwitchBlock.props.children;

    // Toggle to SHARED: cat-pers-sub is PERSONAL with userId, so category must be cleared
    switchBtn.props.onClick();
    expect(mockedSetValue).toHaveBeenCalledWith(
      'visibility',
      TransactionVisibility.SHARED,
      { shouldValidate: true }
    );
    expect(mockedSetValue).toHaveBeenCalledWith('categoryId', '', { shouldValidate: true });
  });

  it('does NOT clear categoryId when toggling visibility if current category is a system category', () => {
    // System category has userId = null
    mockedEditingTx = null;
    mockedWatchOverrides = {
      visibility: TransactionVisibility.PERSONAL,
      categoryId: 'cat-sys-root',
    };
    mockedCoupleStatus = { status: 'ACTIVE' };
    mockedSetValue.mockClear();

    const element = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: null,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    const form = element?.props.children.props.children[1];
    const coupleSwitchBlock = form.props.children[7];
    const [, switchBtn] = coupleSwitchBlock.props.children;

    switchBtn.props.onClick();
    expect(mockedSetValue).toHaveBeenCalledWith(
      'visibility',
      TransactionVisibility.SHARED,
      { shouldValidate: true }
    );
    // categoryId should NOT be cleared because userId is null
    expect(mockedSetValue).not.toHaveBeenCalledWith('categoryId', '', { shouldValidate: true });
  });

  it('renders "Mais detalhes" button with text-brand and aria-expanded=false closed by default', () => {
    mockedEditingTx = null;
    mockedWatchOverrides = {};
    mockedCoupleStatus = { status: 'NONE' };

    const element = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: null,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    const form = element?.props.children.props.children[1];
    const moreDetailsBtnBlock = form.props.children[8];
    const button = moreDetailsBtnBlock.props.children;

    expect(button.props['aria-expanded']).toBe(false);
    expect(button.props.className).toContain('text-brand');
    const [spanLabel, icon] = button.props.children;
    expect(spanLabel.props.children).toBe('Mais detalhes');
    expect(icon.props.className).toContain('text-brand');

    // Collapsible content is closed and takes zero space
    const collapsibleContent = form.props.children[9];
    expect(collapsibleContent).toBeFalsy();
  });

  it('opens "Mais detalhes" when defaultDetailsOpen={true} is passed', () => {
    mockedEditingTx = null;
    mockedWatchOverrides = {};
    mockedCoupleStatus = { status: 'NONE' };

    const element = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: null,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
      defaultDetailsOpen: true,
    });

    const form = element?.props.children.props.children[1];
    const moreDetailsBtnBlock = form.props.children[8];
    const button = moreDetailsBtnBlock.props.children;
    expect(button.props['aria-expanded']).toBe(true);

    const collapsibleContent = form.props.children[9];
    expect(collapsibleContent).toBeTruthy();
    expect(collapsibleContent.props.id).toBe('transaction-more-details');
  });

  it('opens "Mais detalhes" by default in edit mode when transaction has non-default values', () => {
    mockedEditingTx = {
      ...dummyEditingTransaction,
      isRecurring: true,
    };
    mockedWatchOverrides = {};
    mockedCoupleStatus = { status: 'NONE' };

    const element = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: mockedEditingTx,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    const form = element?.props.children.props.children[1];
    const moreDetailsBtnBlock = form.props.children[8];
    const button = moreDetailsBtnBlock.props.children;
    expect(button.props['aria-expanded']).toBe(true);

    const collapsibleContent = form.props.children[9];
    expect(collapsibleContent).toBeTruthy();
  });

  it('renders Competência (type="month"), Vencimento (type="date") and Repetição in collapsible area', () => {
    mockedEditingTx = null;
    mockedWatchOverrides = {};
    mockedCoupleStatus = { status: 'NONE' };

    const element = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: null,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
      defaultDetailsOpen: true,
    });

    const form = element?.props.children.props.children[1];
    const collapsibleContent = form.props.children[9];
    const [datesRow, repetitionRow] = collapsibleContent.props.children;

    // Dates row: Competência (month) + Vencimento (date)
    const [competenceInput, dueDateInput] = datesRow.props.children;
    expect(competenceInput.props.type).toBe('month');
    expect(competenceInput.props.label).toBe('Competência');
    expect(dueDateInput.props.type).toBe('date');
    expect(dueDateInput.props.label).toBe('Vencimento');

    // Repetition row: Select with Único, Parcelado, Fixo Mensal
    const [repetitionSelect] = repetitionRow.props.children;
    expect(repetitionSelect.props.label).toBe('Repetição');
    const options = repetitionSelect.props.children as Array<{ props?: { children?: unknown } }>;
    const optionLabels = options
      .filter((opt) => opt && opt.props && opt.props.children)
      .map((opt) => opt.props?.children);
    expect(optionLabels).toContain('Único');
    expect(optionLabels).toContain('Parcelado');
    expect(optionLabels).toContain('Fixo Mensal');
  });

  it('hides "Parcelado" option from Repetição when transaction type is INCOME', () => {
    mockedEditingTx = null;
    mockedWatchOverrides = { type: TransactionType.INCOME };
    mockedCoupleStatus = { status: 'NONE' };

    const element = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: null,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: vi.fn(),
      isSubmitting: false,
      defaultDetailsOpen: true,
    });

    const form = element?.props.children.props.children[1];
    const collapsibleContent = form.props.children[9];
    const [, repetitionRow] = collapsibleContent.props.children;
    const [repetitionSelect] = repetitionRow.props.children;

    const options = repetitionSelect.props.children as Array<{ props?: { children?: unknown } }>;
    const optionLabels = options
      .filter((opt) => opt && opt.props && opt.props.children)
      .map((opt) => opt.props?.children);
    expect(optionLabels).toContain('Único');
    expect(optionLabels).not.toContain('Parcelado');
    expect(optionLabels).toContain('Fixo Mensal');
  });

  it('normalizes competenceDate to YYYY-MM-01 and forces PERSONAL visibility when no active couple on submit', async () => {
    mockedEditingTx = null;
    mockedWatchOverrides = {};
    mockedCoupleStatus = { status: 'NONE' };

    const onSubmitMock = vi.fn().mockResolvedValue(undefined);

    const element = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: null,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: onSubmitMock,
      isSubmitting: false,
    });

    const form = element?.props.children.props.children[1];
    await form.props.onSubmit({
      type: TransactionType.EXPENSE,
      amount: 120,
      description: 'Conta de Água',
      accountId: 'acc-checking-1',
      categoryId: 'cat-pers-sub',
      dueDate: '2026-10-15',
      competenceDate: '2026-10',
      paymentDate: '',
      status: TransactionStatus.PENDING,
      visibility: TransactionVisibility.SHARED, // should be forced to PERSONAL since no couple
      repetitionType: RepetitionType.SINGLE,
      totalInstallments: null,
      isRecurring: false,
      recurrenceRule: RecurrenceRule.MONTHLY,
    });

    expect(onSubmitMock).toHaveBeenCalledTimes(1);
    const submittedData = onSubmitMock.mock.calls[0][0];
    expect(submittedData.competenceDate).toBe('2026-10-01');
    expect(submittedData.visibility).toBe(TransactionVisibility.PERSONAL);
  });

  it('preserves SHARED visibility when user has active couple on submit', async () => {
    mockedEditingTx = null;
    mockedWatchOverrides = {};
    mockedCoupleStatus = { status: 'ACTIVE' };

    const onSubmitMock = vi.fn().mockResolvedValue(undefined);

    const element = TransactionFormModal({
      isOpen: true,
      onClose: vi.fn(),
      editingTransaction: null,
      accounts: dummyAccounts,
      categories: dummyCategories,
      onSubmit: onSubmitMock,
      isSubmitting: false,
    });

    const form = element?.props.children.props.children[1];
    await form.props.onSubmit({
      type: TransactionType.EXPENSE,
      amount: 200,
      description: 'Jantar',
      accountId: 'acc-checking-1',
      categoryId: 'cat-shared-sub',
      dueDate: '2026-10-20',
      competenceDate: '',
      paymentDate: '',
      status: TransactionStatus.PENDING,
      visibility: TransactionVisibility.SHARED,
      repetitionType: RepetitionType.SINGLE,
      totalInstallments: null,
      isRecurring: false,
      recurrenceRule: RecurrenceRule.MONTHLY,
    });

    expect(onSubmitMock).toHaveBeenCalledTimes(1);
    const submittedData = onSubmitMock.mock.calls[0][0];
    expect(submittedData.competenceDate).toBe('');
    expect(submittedData.visibility).toBe(TransactionVisibility.SHARED);
  });
});


