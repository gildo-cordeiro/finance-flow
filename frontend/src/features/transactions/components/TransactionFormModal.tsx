import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, AlertTriangle } from 'lucide-react';
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
import { Account } from '../../accounts/types';
import {
  Category,
  Transaction,
  TransactionStatus,
  TransactionType,
  TransactionVisibility,
} from '../types';
import { cn } from '../../../lib/cn';

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
    if (!watch('accountId') && accounts.length > 0) {
      const firstChecking = accounts.find((a) => a.type !== 'CREDIT_CARD');
      setValue('accountId', firstChecking?.id || accounts[0]?.id || '');
    }
  }, [isOpen, editingTransaction, accounts, setValue, watch]);

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

  const handleSelectType = (newType: TransactionType) => {
    if (newType === watchedType) return;
    setValue('type', newType);
    setTransFormError(null);

    if (newType === TransactionType.INCOME) {
      setValue('repetitionType', RepetitionType.SINGLE);
      setValue('totalInstallments', null);

      const currentAcc = accounts.find((a) => a.id === watch('accountId'));
      if (currentAcc?.type === 'CREDIT_CARD') {
        const firstChecking = accounts.find((a) => a.type !== 'CREDIT_CARD');
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
