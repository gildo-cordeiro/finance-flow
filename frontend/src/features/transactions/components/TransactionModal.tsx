import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Info, AlertTriangle, TrendingUp, TrendingDown, CreditCard } from 'lucide-react';
import { transactionSchema, TransactionFormData, RepetitionType, RecurrenceRule } from '../schemas/transactionSchema';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Account } from '../../accounts/types';
import { Category, Transaction, TransactionStatus, TransactionType, TransactionVisibility } from '../types';
import { cn } from '../../../lib/cn';

enum TransactionFlow {
  EXPENSE_NORMAL = 'EXPENSE_NORMAL',
  EXPENSE_CARD = 'EXPENSE_CARD',
  INCOME = 'INCOME',
}

// Helper function to check if a category belongs to income
const isIncomeCategory = (catId: string, categories: Category[]): boolean => {
  if (!catId) return false;
  const cat = categories.find(c => c.id === catId);
  if (!cat) return false;
  if (cat.name === 'Receitas' && !cat.parentId) return true;
  if (cat.parentId) {
    const parent = categories.find(c => c.id === cat.parentId);
    return parent ? parent.name === 'Receitas' && !parent.parentId : false;
  }
  return false;
};

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTransaction: Transaction | null;
  accounts: Account[];
  categories: Category[];
  onSubmit: (data: TransactionFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function TransactionModal({
  isOpen,
  onClose,
  editingTransaction,
  accounts,
  categories,
  onSubmit,
  isSubmitting,
}: TransactionModalProps) {
  const [currentFlow, setCurrentFlow] = useState<TransactionFlow>(TransactionFlow.EXPENSE_NORMAL);
  const [transFormError, setTransFormError] = useState<string | null>(null);

  const getTodayStr = () => {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  };

  const {
    register: registerTrans,
    handleSubmit: handleTransSubmit,
    watch: watchTrans,
    setValue: setValueTrans,
    reset: resetTrans,
    formState: { errors: errorsTrans },
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
    }
  });

  const watchedRepetitionType = watchTrans('repetitionType');
  const watchedAccountId = watchTrans('accountId');
  const watchedVisibility = watchTrans('visibility');
  const watchedStatus = watchTrans('status');

  const selectedAccount = accounts.find(a => a.id === watchedAccountId);
  const isIncome = currentFlow === TransactionFlow.INCOME;
  const isCreditCardExpense = currentFlow === TransactionFlow.EXPENSE_CARD;
  const isNormalExpense = currentFlow === TransactionFlow.EXPENSE_NORMAL;


  // Filter root categories based on current flow
  const filteredCategories = categories.filter(c => {
    if (!c.userId) return true;
    return c.visibility === watchedVisibility;
  });
  const rootCategories = filteredCategories.filter(c => !c.parentId);
  const filteredRootCategories = rootCategories.filter(parent => {
    if (currentFlow === TransactionFlow.INCOME) {
      return parent.name === 'Receitas';
    } else {
      return parent.name !== 'Receitas';
    }
  });
  const getSubcategories = (parentId: string) => filteredCategories.filter(c => c.parentId === parentId);

  // Filter accounts based on current flow
  const filteredAccounts = accounts.filter(a => {
    if (currentFlow === TransactionFlow.EXPENSE_CARD) {
      return a.type === 'CREDIT_CARD';
    } else {
      return a.type !== 'CREDIT_CARD';
    }
  });

  const getAccountLabel = () => {
    if (currentFlow === TransactionFlow.INCOME) return 'Conta Destino';
    if (currentFlow === TransactionFlow.EXPENSE_CARD) return 'Cartão de Crédito';
    return 'Conta Origem';
  };

  const getDueDateLabel = () => {
    if (currentFlow === TransactionFlow.EXPENSE_CARD) return 'Data da Compra';
    if (currentFlow === TransactionFlow.INCOME) return 'Data Prevista';
    return 'Vencimento';
  };

  // Sync initialization on edit / open
  useEffect(() => {
    if (!isOpen) return;

    if (editingTransaction) {
      let repetitionType: RepetitionType = RepetitionType.SINGLE;
      if (editingTransaction.installmentGroupId) repetitionType = RepetitionType.INSTALLMENT;
      else if (editingTransaction.isRecurring) repetitionType = RepetitionType.RECURRING;

      resetTrans({
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
        recurrenceRule: (editingTransaction.recurrenceRule as RecurrenceRule) || RecurrenceRule.MONTHLY,
      });

      const acc = accounts.find(a => a.id === editingTransaction.accountId);
      if (editingTransaction.type === TransactionType.INCOME) {
        setCurrentFlow(TransactionFlow.INCOME);
      } else if (acc?.type === 'CREDIT_CARD') {
        setCurrentFlow(TransactionFlow.EXPENSE_CARD);
      } else {
        setCurrentFlow(TransactionFlow.EXPENSE_NORMAL);
      }
    } else {
      const firstChecking = accounts.find(a => a.type !== 'CREDIT_CARD');
      resetTrans({
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
      setCurrentFlow(TransactionFlow.EXPENSE_NORMAL);
    }
    setTransFormError(null);
  }, [isOpen, editingTransaction, accounts, resetTrans]);

  // Sync currentFlow when editingTransaction and accounts are loaded
  useEffect(() => {
    if (!editingTransaction || accounts.length === 0 || !isOpen) return;

    const acc = accounts.find(a => a.id === editingTransaction.accountId);
    if (editingTransaction.type === TransactionType.INCOME) {
      setCurrentFlow(TransactionFlow.INCOME);
    } else if (acc?.type === 'CREDIT_CARD') {
      setCurrentFlow(TransactionFlow.EXPENSE_CARD);
    } else {
      setCurrentFlow(TransactionFlow.EXPENSE_NORMAL);
    }
  }, [editingTransaction, accounts, isOpen]);

  // Reset category if it is incompatible with the current flow
  useEffect(() => {
    if (!currentFlow || !isOpen) return;

    const currentCategoryId = watchTrans('categoryId');
    if (currentCategoryId) {
      const isIncome = isIncomeCategory(currentCategoryId, categories);
      if (currentFlow === TransactionFlow.INCOME && !isIncome) {
        setValueTrans('categoryId', '');
      } else if (currentFlow !== TransactionFlow.INCOME && isIncome) {
        setValueTrans('categoryId', '');
      }
    }
  }, [currentFlow, categories, isOpen, setValueTrans, watchTrans]);

  const handleSwitchFlow = (flow: TransactionFlow) => {
    setCurrentFlow(flow);
    setTransFormError(null);

    if (flow === TransactionFlow.INCOME) {
      setValueTrans('type', TransactionType.INCOME);
      setValueTrans('repetitionType', RepetitionType.SINGLE);
      setValueTrans('totalInstallments', null);

      const currentAcc = accounts.find(a => a.id === watchTrans('accountId'));
      if (currentAcc?.type === 'CREDIT_CARD') {
        const firstChecking = accounts.find(a => a.type !== 'CREDIT_CARD');
        setValueTrans('accountId', firstChecking?.id || '');
      }

      const currentCatId = watchTrans('categoryId');
      if (currentCatId && !isIncomeCategory(currentCatId, categories)) {
        setValueTrans('categoryId', '');
      }
    } else if (flow === TransactionFlow.EXPENSE_CARD) {
      setValueTrans('type', TransactionType.EXPENSE);

      const currentAcc = accounts.find(a => a.id === watchTrans('accountId'));
      if (currentAcc?.type !== 'CREDIT_CARD') {
        const firstCard = accounts.find(a => a.type === 'CREDIT_CARD');
        setValueTrans('accountId', firstCard?.id || '');
      }

      const currentCatId = watchTrans('categoryId');
      if (currentCatId && isIncomeCategory(currentCatId, categories)) {
        setValueTrans('categoryId', '');
      }
    } else {
      setValueTrans('type', TransactionType.EXPENSE);

      const currentAcc = accounts.find(a => a.id === watchTrans('accountId'));
      if (currentAcc?.type === 'CREDIT_CARD') {
        const firstChecking = accounts.find(a => a.type !== 'CREDIT_CARD');
        setValueTrans('accountId', firstChecking?.id || '');
      }

      const currentCatId = watchTrans('categoryId');
      if (currentCatId && isIncomeCategory(currentCatId, categories)) {
        setValueTrans('categoryId', '');
      }
    }
  };

  const onFormSubmit = async (data: TransactionFormData) => {
    try {
      await onSubmit(data);
    } catch (err) {
      const error = err as Error;
      setTransFormError(error.message || 'Erro ao processar lançamento.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={cn(
        "auth-card w-full max-w-lg p-6 space-y-6 animate-in fade-in zoom-in-95 duration-150 border-t-4",
        isIncome && "border-t-emerald-500",
        isCreditCardExpense && "border-t-violet-500",
        isNormalExpense && "border-t-red-500"
      )}>
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            {isIncome && <TrendingUp className="w-5 h-5 text-emerald-400" />}
            {isCreditCardExpense && <CreditCard className="w-5 h-5 text-violet-400" />}
            {isNormalExpense && <TrendingDown className="w-5 h-5 text-red-400" />}
            {isIncome && "Registrar Receita"}
            {isCreditCardExpense && "Registrar Despesa no Cartão"}
            {isNormalExpense && "Registrar Despesa"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleTransSubmit(onFormSubmit)} className="space-y-4">
          {/* Banner visual dinâmico do fluxo de transação */}
          {isIncome && (
            <div className="flex items-center gap-2.5 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs">
              <span className="font-semibold px-2 py-0.5 bg-emerald-500 text-black rounded-lg text-xs uppercase tracking-wider shrink-0 font-bold">Receita</span>
              <span>Fluxo de entrada financeira: o valor será creditado no saldo da conta informada.</span>
            </div>
          )}
          {isNormalExpense && (
            <div className="flex items-center gap-2.5 px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">
              <span className="font-semibold px-2 py-0.5 bg-red-500 text-white rounded-lg text-xs uppercase tracking-wider shrink-0 font-bold">Despesa</span>
              <span>Fluxo de saída financeira: o valor será debitado do saldo da conta corrente ou poupança.</span>
            </div>
          )}
          {isCreditCardExpense && (
            <div className="flex items-center gap-2.5 px-3 py-2 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-xl text-xs">
              <span className="font-semibold px-2 py-0.5 bg-violet-500 text-white rounded-lg text-xs uppercase tracking-wider shrink-0 font-bold">Cartão</span>
              <span>Lançamento na fatura do cartão: o valor irá consumir o limite do cartão e será pago no vencimento da fatura.</span>
            </div>
          )}

          {transFormError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{transFormError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">Tipo de Lançamento</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSwitchFlow(TransactionFlow.EXPENSE_NORMAL)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 ${currentFlow === TransactionFlow.EXPENSE_NORMAL ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  Despesa
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchFlow(TransactionFlow.EXPENSE_CARD)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 ${currentFlow === TransactionFlow.EXPENSE_CARD ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  No Cartão
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchFlow(TransactionFlow.INCOME)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 ${currentFlow === TransactionFlow.INCOME ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Receita
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <Input
                isCurrency={true}
                label="Valor"
                placeholder="0,00"
                error={errorsTrans.amount?.message}
                {...registerTrans('amount')}
              />
            </div>
            <div className="col-span-2">
              <Input
                type="text"
                label="Descrição"
                placeholder={currentFlow === TransactionFlow.INCOME ? "Ex: Salário, Vendas..." : "Ex: Supermercado, Aluguel..."}
                error={errorsTrans.description?.message}
                {...registerTrans('description')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label={getAccountLabel()}
              error={errorsTrans.accountId?.message}
              {...registerTrans('accountId')}
            >
              <option value="">Selecione...</option>
              {filteredAccounts.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.bank})</option>
              ))}
            </Select>

            <Select
              label="Categoria"
              error={errorsTrans.categoryId?.message}
              {...registerTrans('categoryId')}
            >
              <option value="">Selecione...</option>
              {filteredRootCategories.map(parent => (
                <React.Fragment key={parent.id}>
                  <option value={parent.id} className="font-bold text-violet-400" disabled>{parent.name}</option>
                  {getSubcategories(parent.id).map(sub => (
                    <option key={sub.id} value={sub.id}>&nbsp;&nbsp;&nbsp;&nbsp;{sub.name}</option>
                  ))}
                </React.Fragment>
              ))}
            </Select>
          </div>

          {currentFlow === TransactionFlow.EXPENSE_CARD && selectedAccount?.type === 'CREDIT_CARD' && (
            <div className="p-3 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs rounded-xl flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5 text-violet-300">Gestão Inteligente de Fatura Ativa</span>
                O sistema calculará a competência baseando-se no fechamento (dia {selectedAccount.closingDay}). O vencimento e o pagamento deste lançamento serão definidos automaticamente para o dia de vencimento da fatura correspondente (dia {selectedAccount.dueDay}), garantindo a precisão do seu Fluxo de Caixa.
              </div>
            </div>
          )}

          <div className={cn(
            "grid gap-4",
            currentFlow === TransactionFlow.EXPENSE_CARD ? "grid-cols-2" : "grid-cols-3"
          )}>
            <Input
              type="date"
              label={getDueDateLabel()}
              error={errorsTrans.dueDate?.message}
              {...registerTrans('dueDate')}
            />

            <Input
              type="date"
              label="Competência"
              error={errorsTrans.competenceDate?.message}
              {...registerTrans('competenceDate')}
            />

            {currentFlow !== TransactionFlow.EXPENSE_CARD && (
              <Input
                type="date"
                label={currentFlow === TransactionFlow.INCOME ? "Data Recebimento" : "Data Pagamento"}
                error={errorsTrans.paymentDate?.message}
                disabled={watchedStatus !== TransactionStatus.PAID}
                {...registerTrans('paymentDate')}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Repetição"
              error={errorsTrans.repetitionType?.message}
              disabled={!!editingTransaction}
              {...registerTrans('repetitionType')}
            >
              <option value={RepetitionType.SINGLE}>Único</option>
              {currentFlow !== TransactionFlow.INCOME && <option value={RepetitionType.INSTALLMENT}>Parcelado</option>}
              <option value={RepetitionType.RECURRING}>Fixo Mensal</option>
            </Select>

            {watchedRepetitionType === RepetitionType.INSTALLMENT && currentFlow !== TransactionFlow.INCOME && (
              <Input
                type="number"
                label="Nº de Parcelas"
                placeholder="Ex: 3"
                disabled={!!editingTransaction}
                error={errorsTrans.totalInstallments?.message}
                {...registerTrans('totalInstallments')}
              />
            )}

            {watchedRepetitionType === RepetitionType.RECURRING && (
              <Select
                label="Frequência"
                disabled={!!editingTransaction}
                error={errorsTrans.recurrenceRule?.message}
                {...registerTrans('recurrenceRule')}
              >
                <option value={RecurrenceRule.MONTHLY}>Mensal</option>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              error={errorsTrans.status?.message}
              value={watchedStatus}
              onChange={(e) => {
                const newStatus = e.target.value as TransactionStatus;
                setValueTrans('status', newStatus);
                if (newStatus !== TransactionStatus.PAID) {
                  setValueTrans('paymentDate', '');
                } else {
                  setValueTrans('paymentDate', getTodayStr());
                }
              }}
            >
              <option value={TransactionStatus.PLANNED}>Planejado</option>
              <option value={TransactionStatus.PENDING}>Pendente</option>
              <option value={TransactionStatus.PAID}>
                {currentFlow === TransactionFlow.INCOME ? 'Recebido' : currentFlow === TransactionFlow.EXPENSE_CARD ? 'Confirmado' : 'Pago'}
              </option>
              <option value={TransactionStatus.OVERDUE}>Atrasado</option>
            </Select>

            <Select
              label="Visibilidade"
              error={errorsTrans.visibility?.message}
              {...registerTrans('visibility')}
            >
              <option value={TransactionVisibility.PERSONAL}>Pessoal (Privado)</option>
              <option value={TransactionVisibility.SHARED}>Compartilhado (Casal)</option>
            </Select>
          </div>

          <div className="flex justify-end gap-3 border-t border-zinc-800 pt-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <Button
              type="submit"
              loading={isSubmitting}
              className={cn(
                "w-auto font-semibold shadow-lg transition-all",
                isIncome && "bg-emerald-600 hover:bg-emerald-500 text-white focus:ring-emerald-500 shadow-emerald-500/25",
                isNormalExpense && "bg-red-600 hover:bg-red-500 text-white focus:ring-red-500 shadow-red-500/25",
                isCreditCardExpense && "bg-violet-600 hover:bg-violet-500 text-white focus:ring-violet-500 shadow-violet-500/25"
              )}
            >
              {isIncome ? "Confirmar Receita" : isCreditCardExpense ? "Confirmar Compra no Cartão" : "Confirmar Despesa"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
