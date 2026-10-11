import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, AlertTriangle, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  transactionSchema,
  TransactionFormData,
  RepetitionType,
  RecurrenceRule,
} from '../schemas/transactionSchema';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { CurrencyInput } from '../../../components/ui/CurrencyInput';
import { SectionLabel } from '../../../components/ui/SectionLabel';
import { Account } from '../../accounts/types';
import {
  Category,
  Transaction,
  TransactionStatus,
  TransactionType,
  TransactionVisibility,
} from '../types';
import { useCouple } from '../../couple/hooks/useCouple';
import { cn } from '../../../lib/cn';

// Helper to parse date string YYYY-MM-DD safely into Date without timezone offsets
const parseDateParts = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m, d);
    }
  }
  return new Date();
};

// Helper to determine invoice month based on card closing day and temporal-competence rule
const getInvoiceMonthText = (card: Account | undefined, dueDateStr: string): string => {
  if (!card?.closingDay || card.closingDay <= 0) {
    return 'Entra na próxima fatura';
  }

  const txDate = parseDateParts(dueDateStr);

  // temporal-competence: compra até o dia de fechamento entra no mês atual; depois, no mês seguinte
  const compDate =
    txDate.getDate() <= card.closingDay
      ? new Date(txDate.getFullYear(), txDate.getMonth(), 1)
      : new Date(txDate.getFullYear(), txDate.getMonth() + 1, 1);

  const monthName = format(compDate, 'MMMM', { locale: ptBR });
  return `Entra na fatura de ${monthName}`;
};

// Helper to determine if a transaction has non-default details in the collapsible area
export const hasNonDefaultDetails = (
  tx: Transaction | null,
  accountsList: Account[]
): boolean => {
  if (!tx) return false;

  // 1. Repetição não padrão (qualquer repetição além de Único / SINGLE)
  if (
    tx.installmentGroupId ||
    (tx.totalInstallments && tx.totalInstallments > 1) ||
    tx.isRecurring
  ) {
    return true;
  }

  // 2. Competência não padrão
  if (tx.competenceDate) {
    const compMonth = tx.competenceDate.slice(0, 7);
    const acc = accountsList.find((a) => a.id === tx.accountId);
    if (acc?.type === 'CREDIT_CARD' && acc.closingDay && tx.dueDate) {
      const txDate = parseDateParts(tx.dueDate);
      const expectedDate =
        txDate.getDate() <= acc.closingDay
          ? new Date(txDate.getFullYear(), txDate.getMonth(), 1)
          : new Date(txDate.getFullYear(), txDate.getMonth() + 1, 1);
      const expectedMonth = format(expectedDate, 'yyyy-MM');
      if (compMonth !== expectedMonth) return true;
    } else if (tx.dueDate) {
      const dueMonth = tx.dueDate.slice(0, 7);
      if (compMonth !== dueMonth) return true;
    } else {
      return true;
    }
  }

  return false;
};

// Helper function to check if a category belongs to income
const isIncomeCategory = (catId: string, categories: Category[]): boolean => {
  if (!catId) return false;
  const cat = categories.find((c) => c.id === catId);
  if (!cat) return false;
  if (cat.name === 'Receitas' && !cat.parentId) return true;
  if (cat.parentId) {
    const parent = categories.find((c) => c.id === cat.parentId);
    return parent ? parent.name === 'Receitas' && !parent.parentId : false;
  }
  return false;
};

export interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTransaction: Transaction | null;
  accounts: Account[];
  categories: Category[];
  onSubmit: (data: TransactionFormData) => Promise<void>;
  isSubmitting: boolean;
  defaultDetailsOpen?: boolean;
}

export type DateOption = 'TODAY' | 'YESTERDAY' | 'CUSTOM';

export function TransactionFormModal({
  isOpen,
  onClose,
  editingTransaction,
  accounts,
  categories,
  onSubmit,
  isSubmitting,
  defaultDetailsOpen,
}: TransactionFormModalProps) {
  const [transFormError, setTransFormError] = useState<string | null>(null);
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);
  const currencyInputRef = useRef<HTMLInputElement | null>(null);

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

  const initialDateOption: DateOption = (() => {
    if (editingTransaction?.dueDate) {
      if (editingTransaction.dueDate === getTodayStr()) return 'TODAY';
      if (editingTransaction.dueDate === getYesterdayStr()) return 'YESTERDAY';
      return 'CUSTOM';
    }
    return 'TODAY';
  })();
  const [dateOption, setDateOption] = useState<DateOption>(initialDateOption);

  const { coupleStatus } = useCouple();
  const hasCouple = coupleStatus.status === 'ACTIVE';

  const initialDetailsOpen: boolean =
    defaultDetailsOpen !== undefined
      ? defaultDetailsOpen
      : Boolean(editingTransaction && hasNonDefaultDetails(editingTransaction, accounts));
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(initialDetailsOpen);

  const initialIsPaid: boolean = (() => {
    if (editingTransaction) {
      return (
        editingTransaction.status === TransactionStatus.PAID ||
        Boolean(editingTransaction.paymentDate)
      );
    }
    const defaultAcc =
      accounts.find(
        (a) => (a.status === 'ACTIVE' || !a.status) && a.type !== 'CREDIT_CARD'
      ) || accounts[0];
    const isDefaultCard = defaultAcc?.type === 'CREDIT_CARD';
    return !isDefaultCard;
  })();
  const [isPaid, setIsPaid] = useState<boolean>(initialIsPaid);

  const defaultAccount =
    accounts.find(
      (a) => (a.status === 'ACTIVE' || !a.status) && a.type !== 'CREDIT_CARD'
    ) || accounts[0];
  const isDefaultCard = defaultAccount?.type === 'CREDIT_CARD';
  const todayStr = getTodayStr();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    clearErrors,
    formState: { errors },
  } = useForm<TransactionFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(transactionSchema) as any,
    defaultValues: {
      type: TransactionType.EXPENSE,
      amount: 0,
      description: '',
      accountId: '',
      categoryId: '',
      competenceDate: '',
      dueDate: todayStr,
      paymentDate: isDefaultCard ? '' : todayStr,
      status: isDefaultCard ? TransactionStatus.PENDING : TransactionStatus.PAID,
      visibility: TransactionVisibility.PERSONAL,
      repetitionType: RepetitionType.SINGLE,
      totalInstallments: null,
      isRecurring: false,
      recurrenceRule: RecurrenceRule.MONTHLY,
    },
  });

  const watchedType = watch('type');
  const isIncome = watchedType === TransactionType.INCOME;
  const watchedVisibility = watch('visibility');
  const isShared = watchedVisibility === TransactionVisibility.SHARED;
  const watchedRepetitionType = watch('repetitionType');

  // Filter active accounts and credit cards
  const activeCheckingAccounts = accounts.filter(
    (a) =>
      (a.status === 'ACTIVE' || !a.status || a.id === editingTransaction?.accountId) &&
      a.type !== 'CREDIT_CARD'
  );
  const activeCardAccounts = accounts.filter(
    (a) =>
      (a.status === 'ACTIVE' || !a.status || a.id === editingTransaction?.accountId) &&
      a.type === 'CREDIT_CARD'
  );

  const noAccountsAvailable = isIncome
    ? activeCheckingAccounts.length === 0
    : activeCheckingAccounts.length === 0 && activeCardAccounts.length === 0;

  const watchedAccountId = watch('accountId');
  const selectedAccount = accounts.find((a) => a.id === watchedAccountId);
  const isCardSelected = !isIncome && selectedAccount?.type === 'CREDIT_CARD';

  const watchedTotalInstallments = watch('totalInstallments');
  const watchedDueDate = watch('dueDate');
  const installmentCount =
    watchedTotalInstallments && watchedTotalInstallments > 1
      ? watchedTotalInstallments
      : 1;

  // Filter root categories based on visibility and current type
  const filteredCategories = categories.filter((c) => {
    if (!c.userId) return true;
    return c.visibility === watchedVisibility;
  });
  const rootCategories = filteredCategories.filter((c) => !c.parentId);
  const filteredRootCategories = rootCategories.filter((parent) => {
    if (isIncome) {
      return parent.name === 'Receitas';
    } else {
      return parent.name !== 'Receitas';
    }
  });
  const getSubcategories = (parentId: string) =>
    filteredCategories.filter((c) => c.parentId === parentId);

  // Sync initialization on edit / open
  useEffect(() => {
    if (!isOpen) return;

    if (editingTransaction) {
      let repetitionType: RepetitionType = RepetitionType.SINGLE;
      if (editingTransaction.installmentGroupId) {
        repetitionType = RepetitionType.INSTALLMENT;
      } else if (editingTransaction.isRecurring) {
        repetitionType = RepetitionType.RECURRING;
      }

      if (defaultDetailsOpen === undefined) {
        setIsDetailsOpen(hasNonDefaultDetails(editingTransaction, accounts));
      }

      const txPaid =
        editingTransaction.status === TransactionStatus.PAID ||
        Boolean(editingTransaction.paymentDate);
      setIsPaid(txPaid);

      const tToday = getTodayStr();
      const tYesterday = getYesterdayStr();
      if (editingTransaction.dueDate === tToday) {
        setDateOption('TODAY');
      } else if (editingTransaction.dueDate === tYesterday) {
        setDateOption('YESTERDAY');
      } else {
        setDateOption('CUSTOM');
      }

      const txVisibility =
        hasCouple && editingTransaction.visibility === TransactionVisibility.SHARED
          ? TransactionVisibility.SHARED
          : TransactionVisibility.PERSONAL;

      reset({
        type: editingTransaction.type,
        amount: editingTransaction.amount,
        description: editingTransaction.description,
        accountId: editingTransaction.accountId,
        categoryId: editingTransaction.categoryId,
        competenceDate: editingTransaction.competenceDate
          ? editingTransaction.competenceDate.slice(0, 7)
          : '',
        dueDate: editingTransaction.dueDate,
        paymentDate: editingTransaction.paymentDate || '',
        status: editingTransaction.status,
        visibility: txVisibility,
        repetitionType,
        totalInstallments: editingTransaction.totalInstallments || null,
        isRecurring: editingTransaction.isRecurring,
        recurrenceRule:
          (editingTransaction.recurrenceRule as RecurrenceRule) ||
          RecurrenceRule.MONTHLY,
      });
    } else {
      const firstChecking = accounts.find((a) => a.type !== 'CREDIT_CARD');
      const isCard = !firstChecking && accounts[0]?.type === 'CREDIT_CARD';
      const curToday = getTodayStr();

      if (defaultDetailsOpen === undefined) {
        setIsDetailsOpen(false);
      }

      setDateOption('TODAY');
      setIsPaid(!isCard);

      reset({
        type: TransactionType.EXPENSE,
        amount: 0,
        description: '',
        accountId: firstChecking?.id || accounts[0]?.id || '',
        categoryId: '',
        competenceDate: '',
        dueDate: curToday,
        paymentDate: isCard ? '' : curToday,
        status: isCard ? TransactionStatus.PENDING : TransactionStatus.PAID,
        visibility: TransactionVisibility.PERSONAL,
        repetitionType: RepetitionType.SINGLE,
        totalInstallments: null,
        isRecurring: false,
        recurrenceRule: RecurrenceRule.MONTHLY,
      });
    }
    setTransFormError(null);
  }, [isOpen, editingTransaction, accounts, defaultDetailsOpen, hasCouple, reset]);

  // Handle visibility changes: clear category if it is no longer valid
  const handleToggleCouple = () => {
    const nextVisibility = isShared
      ? TransactionVisibility.PERSONAL
      : TransactionVisibility.SHARED;
    setValue('visibility', nextVisibility, { shouldValidate: true });

    const currentCatId = watch('categoryId');
    if (currentCatId) {
      const selectedCat = categories.find((c) => c.id === currentCatId);
      if (selectedCat && selectedCat.userId && selectedCat.visibility !== nextVisibility) {
        setValue('categoryId', '', { shouldValidate: true });
      }
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const currentCatId = watch('categoryId');
    if (currentCatId) {
      const selectedCat = categories.find((c) => c.id === currentCatId);
      if (selectedCat && selectedCat.userId && selectedCat.visibility !== watchedVisibility) {
        setValue('categoryId', '', { shouldValidate: true });
      }
    }
  }, [isOpen, watchedVisibility, categories, setValue, watch]);

  // Ensure an account is set if accounts load after modal was opened
  useEffect(() => {
    if (!isOpen || editingTransaction) return;
    const currentAccId = watch('accountId');
    const currentAcc = accounts.find((a) => a.id === currentAccId);
    if (isIncome && currentAcc?.type === 'CREDIT_CARD') {
      const firstChecking = accounts.find(
        (a) => (a.status === 'ACTIVE' || !a.status) && a.type !== 'CREDIT_CARD'
      );
      setValue('accountId', firstChecking?.id || '');
    } else if (!currentAccId && accounts.length > 0) {
      const firstChecking = accounts.find(
        (a) => (a.status === 'ACTIVE' || !a.status) && a.type !== 'CREDIT_CARD'
      );
      setValue('accountId', firstChecking?.id || accounts[0]?.id || '');
    }
  }, [isOpen, editingTransaction, accounts, isIncome, setValue, watch]);

  // Reset category if it is incompatible with the current type
  useEffect(() => {
    if (!isOpen) return;

    const currentCategoryId = watch('categoryId');
    if (currentCategoryId) {
      const isCatIncome = isIncomeCategory(currentCategoryId, categories);
      if (isIncome && !isCatIncome) {
        setValue('categoryId', '');
      } else if (!isIncome && isCatIncome) {
        setValue('categoryId', '');
      }
    }
  }, [isOpen, isIncome, categories, setValue, watch]);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSelectToday = () => {
    const today = getTodayStr();
    setDateOption('TODAY');
    setValue('dueDate', today, { shouldValidate: true });
    if (!isCardSelected) {
      setIsPaid(true);
      setValue('paymentDate', today, { shouldValidate: true });
      setValue('status', TransactionStatus.PAID, { shouldValidate: true });
    }
  };

  const handleSelectYesterday = () => {
    const yesterday = getYesterdayStr();
    setDateOption('YESTERDAY');
    setValue('dueDate', yesterday, { shouldValidate: true });
    if (!isCardSelected) {
      setIsPaid(true);
      setValue('paymentDate', yesterday, { shouldValidate: true });
      setValue('status', TransactionStatus.PAID, { shouldValidate: true });
    }
  };

  const handleSelectCustomDate = () => {
    setDateOption('CUSTOM');
  };

  const handleCustomDateChange = (newDate: string) => {
    setValue('dueDate', newDate, { shouldValidate: true });
    if (!isCardSelected && newDate) {
      const isFuture = newDate > getTodayStr();
      if (isFuture) {
        setIsPaid(false);
        setValue('paymentDate', '', { shouldValidate: true });
        setValue('status', TransactionStatus.PENDING, { shouldValidate: true });
      } else {
        setIsPaid(true);
        setValue('paymentDate', newDate, { shouldValidate: true });
        setValue('status', TransactionStatus.PAID, { shouldValidate: true });
      }
    }
  };

  const handleTogglePaid = () => {
    const nextPaid = !isPaid;
    setIsPaid(nextPaid);
    if (nextPaid) {
      const curDueDate = watch('dueDate') || getTodayStr();
      setValue('paymentDate', curDueDate, { shouldValidate: true });
      setValue('status', TransactionStatus.PAID, { shouldValidate: true });
    } else {
      setValue('paymentDate', '', { shouldValidate: true });
      setValue('status', TransactionStatus.PENDING, { shouldValidate: true });
    }
  };

  const handleSelectAccount = (accId: string) => {
    setValue('accountId', accId);
    setValue('repetitionType', RepetitionType.SINGLE);
    setValue('totalInstallments', null);

    const prevAcc = accounts.find((a) => a.id === watch('accountId'));
    if (prevAcc?.type === 'CREDIT_CARD') {
      const curDueDate = watch('dueDate') || getTodayStr();
      const isFuture = curDueDate > getTodayStr();
      if (isFuture) {
        setIsPaid(false);
        setValue('paymentDate', '', { shouldValidate: true });
        setValue('status', TransactionStatus.PENDING, { shouldValidate: true });
      } else {
        setIsPaid(true);
        setValue('paymentDate', curDueDate, { shouldValidate: true });
        setValue('status', TransactionStatus.PAID, { shouldValidate: true });
      }
    }
  };

  const handleSelectCreditCard = () => {
    if (selectedAccount?.type !== 'CREDIT_CARD' && activeCardAccounts.length > 0) {
      setValue('accountId', activeCardAccounts[0].id);
      setValue('paymentDate', '', { shouldValidate: true });
      setValue('status', TransactionStatus.PENDING, { shouldValidate: true });
      setIsPaid(false);
    }
  };

  const handleDecrementInstallment = () => {
    if (installmentCount <= 1) return;
    if (installmentCount === 2) {
      setValue('repetitionType', RepetitionType.SINGLE);
      setValue('totalInstallments', null);
    } else {
      setValue('repetitionType', RepetitionType.INSTALLMENT);
      setValue('totalInstallments', installmentCount - 1);
    }
  };

  const handleIncrementInstallment = () => {
    const next = installmentCount + 1;
    setValue('repetitionType', RepetitionType.INSTALLMENT);
    setValue('totalInstallments', next);
  };

  const handleSelectType = (newType: TransactionType) => {
    if (newType === watchedType) return;
    setValue('type', newType);
    setTransFormError(null);

    if (newType === TransactionType.INCOME) {
      setValue('repetitionType', RepetitionType.SINGLE);
      setValue('totalInstallments', null);

      const currentAcc = accounts.find((a) => a.id === watch('accountId'));
      if (currentAcc?.type === 'CREDIT_CARD') {
        const firstChecking = accounts.find(
          (a) => (a.status === 'ACTIVE' || !a.status) && a.type !== 'CREDIT_CARD'
        );
        setValue('accountId', firstChecking?.id || '');
      }

      const currentCatId = watch('categoryId');
      if (currentCatId && !isIncomeCategory(currentCatId, categories)) {
        setValue('categoryId', '');
      }

      const curDueDate = watch('dueDate') || getTodayStr();
      const isFuture = curDueDate > getTodayStr();
      if (isFuture) {
        setIsPaid(false);
        setValue('paymentDate', '', { shouldValidate: true });
        setValue('status', TransactionStatus.PENDING, { shouldValidate: true });
      } else {
        setIsPaid(true);
        setValue('paymentDate', curDueDate, { shouldValidate: true });
        setValue('status', TransactionStatus.PAID, { shouldValidate: true });
      }
    } else {
      const currentCatId = watch('categoryId');
      if (currentCatId && isIncomeCategory(currentCatId, categories)) {
        setValue('categoryId', '');
      }
    }
  };

  const normalizeData = (data: TransactionFormData): TransactionFormData => {
    let compDate = data.competenceDate;
    if (compDate && compDate.length === 7) {
      compDate = `${compDate}-01`;
    }
    return {
      ...data,
      competenceDate: compDate || '',
      visibility: hasCouple ? data.visibility : TransactionVisibility.PERSONAL,
    };
  };

  const onFormSubmit = async (data: TransactionFormData) => {
    try {
      setIsSubmittingLocal(true);
      setTransFormError(null);
      await onSubmit(normalizeData(data));
    } catch (err) {
      const error = err as Error;
      setTransFormError(error.message || 'Erro ao processar lançamento.');
    } finally {
      setIsSubmittingLocal(false);
    }
  };

  const handleSaveAndAddAnother = async () => {
    setTransFormError(null);
    await handleSubmit(async (data: TransactionFormData) => {
      try {
        setIsSubmittingLocal(true);
        await onSubmit(normalizeData(data));
        setValue('amount', 0);
        setValue('description', '');
        clearErrors('amount');
        clearErrors('description');
        setTimeout(() => {
          currencyInputRef.current?.focus();
        }, 50);
      } catch (err) {
        const error = err as Error;
        setTransFormError(error.message || 'Erro ao processar lançamento.');
      } finally {
        setIsSubmittingLocal(false);
      }
    })();
  };

  if (!isOpen) return null;

  const isBusy = isSubmitting || isSubmittingLocal;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg bg-bg-surface border border-border-subtle rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border-subtle">
          <h2 className="text-base font-semibold text-text-primary">
            {editingTransaction ? 'Editar lançamento' : 'Novo lançamento'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="w-10 h-10 flex items-center justify-center rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="p-5 space-y-5">
          {/* Error Message */}
          {transFormError && (
            <div className="p-3 bg-danger/10 border border-danger/20 text-danger text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{transFormError}</span>
            </div>
          )}

          {/* Segmented Control: Despesa | Receita */}
          <div className="bg-bg-base rounded-xl p-1 grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => handleSelectType(TransactionType.EXPENSE)}
              className={cn(
                'h-11 rounded-lg text-sm font-medium transition-all flex items-center justify-center',
                !isIncome
                  ? 'bg-danger/15 text-danger font-semibold'
                  : 'bg-transparent text-text-muted hover:text-text-label'
              )}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => handleSelectType(TransactionType.INCOME)}
              className={cn(
                'h-11 rounded-lg text-sm font-medium transition-all flex items-center justify-center',
                isIncome
                  ? 'bg-success/15 text-success font-semibold'
                  : 'bg-transparent text-text-muted hover:text-text-label'
              )}
            >
              Receita
            </button>
          </div>

          {/* Valor (CurrencyInput) */}
          <Controller
            control={control}
            name="amount"
            render={({ field, fieldState }) => (
              <CurrencyInput
                ref={(el) => {
                  field.ref(el);
                  currencyInputRef.current = el;
                }}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                autoFocus={!editingTransaction}
              />
            )}
          />

          {/* Descrição */}
          <Input
            label="Descrição"
            placeholder="Ex.: Supermercado, aluguel"
            error={errors.description?.message}
            {...register('description')}
          />

          {/* Categoria */}
          <Select
            label="Categoria"
            error={errors.categoryId?.message}
            {...register('categoryId')}
          >
            <option value="">Selecione...</option>
            {filteredRootCategories.map((parent) => {
              const subs = getSubcategories(parent.id);
              if (subs.length === 0) {
                return (
                  <option key={parent.id} value={parent.id}>
                    {parent.name}
                  </option>
                );
              }
              return (
                <React.Fragment key={parent.id}>
                  <option value={parent.id} className="font-bold text-violet-400" disabled>
                    {parent.name}
                  </option>
                  {subs.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      &nbsp;&nbsp;&nbsp;&nbsp;{sub.name}
                    </option>
                  ))}
                </React.Fragment>
              );
            })}
          </Select>

          {/* Seção Pago com / Recebido em */}
          <div className="space-y-3">
            <SectionLabel>{isIncome ? 'Recebido em' : 'Pago com'}</SectionLabel>

            {noAccountsAvailable ? (
              <div className="text-sm text-text-muted">
                <Link to="/accounts" className="text-brand hover:underline">
                  Cadastre uma conta
                </Link>
              </div>
            ) : (
              <>
                {/* Chips de contas e cartão */}
                <div className="flex flex-wrap gap-2">
                  {activeCheckingAccounts.map((acc) => {
                    const isSelected = !isCardSelected && watchedAccountId === acc.id;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => handleSelectAccount(acc.id)}
                        className={cn(
                          'h-11 px-3.5 rounded-xl border text-sm font-medium transition-colors flex items-center justify-center',
                          isSelected
                            ? 'border-brand bg-brand/15 text-text-primary'
                            : 'border-border-subtle bg-bg-surface text-text-muted hover:text-text-primary hover:bg-bg-elevated'
                        )}
                      >
                        {acc.name}
                      </button>
                    );
                  })}

                  {!isIncome && activeCardAccounts.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectCreditCard}
                      className={cn(
                        'h-11 px-3.5 rounded-xl border text-sm font-medium transition-colors flex items-center justify-center',
                        isCardSelected
                          ? 'border-brand bg-brand/15 text-text-primary'
                          : 'border-border-subtle bg-bg-surface text-text-muted hover:text-text-primary hover:bg-bg-elevated'
                      )}
                    >
                      Cartão de crédito
                    </button>
                  )}
                </div>

                {errors.accountId?.message && (
                  <p className="text-xs text-danger">{errors.accountId.message}</p>
                )}

                {/* Opções de Cartão quando Cartão está selecionado */}
                {isCardSelected && (
                  <div className="space-y-3 pt-1">
                    {activeCardAccounts.length > 1 && (
                      <Select
                        aria-label="Selecionar cartão de crédito"
                        value={watchedAccountId}
                        onChange={(e) => setValue('accountId', e.target.value)}
                      >
                        {activeCardAccounts.map((card) => (
                          <option key={card.id} value={card.id}>
                            {card.name} ({card.bank})
                          </option>
                        ))}
                      </Select>
                    )}

                    {/* Bloco Parcelas */}
                    <div className="flex items-center justify-between p-3.5 bg-bg-surface border border-border-subtle rounded-xl">
                      <div>
                        <div className="text-sm font-semibold text-text-primary">
                          Parcelas
                        </div>
                        <div className="text-xs text-text-muted mt-0.5">
                          {getInvoiceMonthText(selectedAccount, watchedDueDate)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label="Menos uma parcela"
                          disabled={installmentCount <= 1 || isBusy}
                          onClick={handleDecrementInstallment}
                          className="w-11 h-11 flex items-center justify-center rounded-xl bg-bg-surface border border-border-subtle text-text-primary hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          −
                        </button>
                        <span className="min-w-[36px] text-center text-sm font-semibold text-text-primary">
                          {`${installmentCount}x`}
                        </span>
                        <button
                          type="button"
                          aria-label="Mais uma parcela"
                          disabled={isBusy}
                          onClick={handleIncrementInstallment}
                          className="w-11 h-11 flex items-center justify-center rounded-xl bg-bg-surface border border-border-subtle text-text-primary hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Seção Data */}
          <div className="space-y-3">
            <SectionLabel>{isCardSelected ? 'Data da compra' : 'Data'}</SectionLabel>

            {/* Chips de data */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSelectToday}
                className={cn(
                  'h-11 px-3.5 rounded-xl border text-sm font-medium transition-colors flex items-center justify-center',
                  dateOption === 'TODAY'
                    ? 'border-brand bg-brand/15 text-text-primary'
                    : 'border-border-subtle bg-bg-surface text-text-muted hover:text-text-primary hover:bg-bg-elevated'
                )}
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={handleSelectYesterday}
                className={cn(
                  'h-11 px-3.5 rounded-xl border text-sm font-medium transition-colors flex items-center justify-center',
                  dateOption === 'YESTERDAY'
                    ? 'border-brand bg-brand/15 text-text-primary'
                    : 'border-border-subtle bg-bg-surface text-text-muted hover:text-text-primary hover:bg-bg-elevated'
                )}
              >
                Ontem
              </button>
              <button
                type="button"
                onClick={handleSelectCustomDate}
                className={cn(
                  'h-11 px-3.5 rounded-xl border text-sm font-medium transition-colors flex items-center justify-center',
                  dateOption === 'CUSTOM'
                    ? 'border-brand bg-brand/15 text-text-primary'
                    : 'border-border-subtle bg-bg-surface text-text-muted hover:text-text-primary hover:bg-bg-elevated'
                )}
              >
                Outra data
              </button>
            </div>

            {errors.dueDate?.message && dateOption !== 'CUSTOM' && (
              <p className="text-xs text-danger">{errors.dueDate.message}</p>
            )}

            {dateOption === 'CUSTOM' && (
              <Input
                type="date"
                aria-label="Outra data"
                className="[color-scheme:dark]"
                value={watchedDueDate}
                onChange={(e) => handleCustomDateChange(e.target.value)}
                error={errors.dueDate?.message}
              />
            )}

            {/* Switch Já foi pago / Já foi recebido */}
            {!isCardSelected && (
              <div className="flex items-center justify-between min-h-[44px] pt-1">
                <span
                  onClick={handleTogglePaid}
                  className="text-sm font-medium text-text-primary cursor-pointer select-none"
                >
                  {isIncome ? 'Já foi recebido' : 'Já foi pago'}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isPaid}
                  aria-label={isIncome ? 'Já foi recebido' : 'Já foi pago'}
                  disabled={isBusy}
                  onClick={handleTogglePaid}
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-bg-surface disabled:opacity-50 disabled:cursor-not-allowed',
                    isPaid ? 'bg-brand' : 'bg-bg-elevated border border-border-subtle'
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-text-primary shadow-sm transition duration-200 ease-in-out',
                      isPaid ? 'translate-x-5' : 'translate-x-0.5'
                    )}
                  />
                </button>
              </div>
            )}
          </div>

          {/* Switch Compartilhar com o casal (apenas se tiver casal ativo) */}
          {hasCouple && (
            <div className="flex items-center justify-between min-h-[44px]">
              <span
                onClick={handleToggleCouple}
                className="text-sm font-medium text-text-primary cursor-pointer select-none"
              >
                Compartilhar com o casal
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={isShared}
                aria-label="Compartilhar com o casal"
                disabled={isBusy}
                onClick={handleToggleCouple}
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-bg-surface disabled:opacity-50 disabled:cursor-not-allowed',
                  isShared ? 'bg-brand' : 'bg-bg-elevated border border-border-subtle'
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-text-primary shadow-sm transition duration-200 ease-in-out',
                    isShared ? 'translate-x-5' : 'translate-x-0.5'
                  )}
                />
              </button>
            </div>
          )}

          {/* Botão Mais detalhes */}
          <div>
            <button
              type="button"
              onClick={() => setIsDetailsOpen((prev) => !prev)}
              aria-expanded={isDetailsOpen}
              aria-controls="transaction-more-details"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline transition-colors focus:outline-none min-h-[44px]"
            >
              <span>Mais detalhes</span>
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-brand transition-transform duration-200',
                  isDetailsOpen && 'rotate-180'
                )}
              />
            </button>
          </div>

          {/* Área recolhível de Mais detalhes */}
          {isDetailsOpen && (
            <div
              id="transaction-more-details"
              className="space-y-4 pt-1 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  type="month"
                  label="Competência"
                  className="[color-scheme:dark]"
                  error={errors.competenceDate?.message}
                  {...register('competenceDate')}
                />

                <Input
                  type="date"
                  label="Vencimento"
                  className="[color-scheme:dark]"
                  error={errors.dueDate?.message}
                  {...register('dueDate')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Repetição"
                  error={errors.repetitionType?.message}
                  disabled={Boolean(editingTransaction)}
                  {...register('repetitionType')}
                >
                  <option value={RepetitionType.SINGLE}>Único</option>
                  {!isIncome && <option value={RepetitionType.INSTALLMENT}>Parcelado</option>}
                  <option value={RepetitionType.RECURRING}>Fixo Mensal</option>
                </Select>

                {watchedRepetitionType === RepetitionType.INSTALLMENT && !isIncome && (
                  <Input
                    type="number"
                    label="Nº de Parcelas"
                    placeholder="Ex: 3"
                    disabled={Boolean(editingTransaction)}
                    error={errors.totalInstallments?.message}
                    {...register('totalInstallments')}
                  />
                )}

                {watchedRepetitionType === RepetitionType.RECURRING && (
                  <Select
                    label="Frequência"
                    disabled={Boolean(editingTransaction)}
                    error={errors.recurrenceRule?.message}
                    {...register('recurrenceRule')}
                  >
                    <option value={RecurrenceRule.MONTHLY}>Mensal</option>
                  </Select>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 pt-4 border-t border-border-subtle">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isBusy}
              className="text-text-muted hover:text-text-primary"
            >
              Cancelar
            </Button>
            {!editingTransaction && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleSaveAndAddAnother}
                disabled={isBusy}
                className="bg-transparent border-border-subtle text-text-primary hover:bg-bg-elevated"
              >
                Salvar e adicionar outro
              </Button>
            )}
            <Button
              type="submit"
              loading={isBusy}
              className="bg-brand hover:bg-brand-hover text-white shadow-none"
            >
              Salvar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
