import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, AlertTriangle } from 'lucide-react';
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
}

export function TransactionFormModal({
  isOpen,
  onClose,
  editingTransaction,
  accounts,
  categories,
  onSubmit,
  isSubmitting,
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
      dueDate: getTodayStr(),
      paymentDate: '',
      status: TransactionStatus.PENDING,
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

      reset({
        type: editingTransaction.type,
        amount: editingTransaction.amount,
        description: editingTransaction.description,
        accountId: editingTransaction.accountId,
        categoryId: editingTransaction.categoryId,
        competenceDate: editingTransaction.competenceDate || '',
        dueDate: editingTransaction.dueDate,
        paymentDate: editingTransaction.paymentDate || '',
        status: editingTransaction.status,
        visibility: editingTransaction.visibility,
        repetitionType,
        totalInstallments: editingTransaction.totalInstallments || null,
        isRecurring: editingTransaction.isRecurring,
        recurrenceRule:
          (editingTransaction.recurrenceRule as RecurrenceRule) ||
          RecurrenceRule.MONTHLY,
      });
    } else {
      const firstChecking = accounts.find((a) => a.type !== 'CREDIT_CARD');
      reset({
        type: TransactionType.EXPENSE,
        amount: 0,
        description: '',
        accountId: firstChecking?.id || accounts[0]?.id || '',
        categoryId: '',
        competenceDate: '',
        dueDate: getTodayStr(),
        paymentDate: '',
        status: TransactionStatus.PENDING,
        visibility: TransactionVisibility.PERSONAL,
        repetitionType: RepetitionType.SINGLE,
        totalInstallments: null,
        isRecurring: false,
        recurrenceRule: RecurrenceRule.MONTHLY,
      });
    }
    setTransFormError(null);
  }, [isOpen, editingTransaction, accounts, reset]);

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

  const handleSelectAccount = (accId: string) => {
    setValue('accountId', accId);
    setValue('repetitionType', RepetitionType.SINGLE);
    setValue('totalInstallments', null);
  };

  const handleSelectCreditCard = () => {
    if (selectedAccount?.type !== 'CREDIT_CARD' && activeCardAccounts.length > 0) {
      setValue('accountId', activeCardAccounts[0].id);
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
    } else {
      const currentCatId = watch('categoryId');
      if (currentCatId && isIncomeCategory(currentCatId, categories)) {
        setValue('categoryId', '');
      }
    }
  };

  const onFormSubmit = async (data: TransactionFormData) => {
    try {
      setIsSubmittingLocal(true);
      setTransFormError(null);
      await onSubmit(data);
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
        await onSubmit(data);
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
