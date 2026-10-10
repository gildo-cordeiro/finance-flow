import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { useAccounts } from '../../accounts/hooks/useAccounts';
import { useTransactions, useTransactionSummary } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import { useToast } from '../../../context/ToastContext';
import { Plus } from 'lucide-react';
import type { Transaction, TransactionPayload } from '../types';
import { useView } from '../../../context/ViewContext';
import { useCouple } from '../../couple/hooks/useCouple';

import { TransactionFormData, RepetitionType, RecurrenceRule } from '../schemas/transactionSchema';

// Subcomponents
import { TransactionFilters } from './TransactionFilters';
import { TransactionTable } from './TransactionTable';
import { TransactionModal } from './TransactionModal';
import { BulkActionModals } from './BulkActionModals';
import { PeriodSelector } from '../../../components/ui/PeriodSelector';

export function Transactions() {
  const { user } = useAuth();
  const { accounts } = useAccounts();
  const toast = useToast();
  const { categories } = useCategories();
  const { viewContext } = useView();
  const { coupleStatus } = useCouple();
  const isCouple = viewContext === 'COUPLE';
  const partnerName = coupleStatus.partnerName || 'Parceiro(a)';

  // Filters State and URL Month
  const [searchParams, setSearchParams] = useSearchParams();
  const monthParam = searchParams.get('month');

  // Default to current competence month
  const currentCompetenceMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };
  const searchMonth = monthParam || currentCompetenceMonth();

  const [filterAccountId, setFilterAccountId] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PAID' | 'PLANNED' | 'PENDING' | 'OVERDUE'>('ALL');
  const [filterMember, setFilterMember] = useState<'ALL' | 'OWN' | 'PARTNER'>('ALL');

  // Month collapse, pagination and row expansion states
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [monthLimits, setMonthLimits] = useState<Record<string, number>>({});
  const [expandedTransactionId, setExpandedTransactionId] = useState<string | null>(null);

  // Modals state
  const [isTransModalOpen, setIsTransModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isBulkUpdateModalOpen, setIsBulkUpdateModalOpen] = useState(false);
  const [pendingUpdatePayload, setPendingUpdatePayload] = useState<TransactionPayload | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Hook for transactions
  const {
    transactions,
    isLoading: isTransLoading,
    error: transError,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactions(searchMonth, {
    accountId: filterAccountId || undefined,
    categoryId: filterCategoryId || undefined
  });

  // Hook for summary
  const {
    summary: monthSummary,
    isLoading: isSummaryLoading,
  } = useTransactionSummary(searchMonth, {
    accountId: filterAccountId || undefined,
    categoryId: filterCategoryId || undefined
  });

  // Collapse expanded row on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.transactions-table-container')) {
        setExpandedTransactionId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleOpenNewTrans = () => {
    setEditingTransaction(null);
    setIsTransModalOpen(true);
  };

  const handleOpenEditTrans = (t: Transaction) => {
    setEditingTransaction(t);
    setIsTransModalOpen(true);
  };

  const handleTransFormSubmit = async (data: TransactionFormData) => {
    const payload: TransactionPayload = {
      accountId: data.accountId,
      categoryId: data.categoryId,
      description: data.description,
      amount: data.amount,
      type: data.type,
      competenceDate: data.competenceDate || null,
      dueDate: data.dueDate,
      paymentDate: data.status === 'PAID' ? data.paymentDate || null : null,
      status: data.status,
      visibility: data.visibility,
      totalInstallments: data.repetitionType === RepetitionType.INSTALLMENT ? Number(data.totalInstallments) : null,
      isRecurring: data.repetitionType === RepetitionType.RECURRING,
      recurrenceRule: data.repetitionType === RepetitionType.RECURRING ? data.recurrenceRule || RecurrenceRule.MONTHLY : null,
    };

    if (editingTransaction) {
      if (editingTransaction.installmentGroupId || editingTransaction.recurrenceGroupId) {
        setPendingUpdatePayload(payload);
        setIsBulkUpdateModalOpen(true);
      } else {
        await updateTransaction(editingTransaction.id, payload, 'ONLY_THIS');
        setIsTransModalOpen(false);
        setEditingTransaction(null);
        toast.success('Lançamento atualizado com sucesso!');
      }
    } else {
      await createTransaction(payload);
      setIsTransModalOpen(false);
      toast.success('Lançamento adicionado com sucesso!');
    }
  };

  const handleConfirmBulkUpdate = async (mode: 'ONLY_THIS' | 'ALL') => {
    if (!editingTransaction || !pendingUpdatePayload) return;
    try {
      await updateTransaction(editingTransaction.id, pendingUpdatePayload, mode);
      setIsBulkUpdateModalOpen(false);
      setIsTransModalOpen(false);
      setEditingTransaction(null);
      setPendingUpdatePayload(null);
      toast.success('Lançamentos recorrentes atualizados!');
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || 'Erro ao atualizar transações.');
      setIsBulkUpdateModalOpen(false);
    }
  };

  const handleDeleteTrans = async (t: Transaction) => {
    if (t.installmentGroupId || t.recurrenceGroupId) {
      setPendingDeleteId(t.id);
      setIsBulkDeleteModalOpen(true);
    } else {
      if (window.confirm('Tem certeza que deseja excluir este lançamento?')) {
        try {
          await deleteTransaction(t.id, 'ONLY_THIS');
          toast.success('Lançamento excluído com sucesso!');
        } catch (err) {
          const error = err as Error;
          toast.error(error.message || 'Erro ao excluir transação.');
        }
      }
    }
  };

  const handleConfirmBulkDelete = async (mode: 'ONLY_THIS' | 'ALL') => {
    if (!pendingDeleteId) return;
    try {
      await deleteTransaction(pendingDeleteId, mode);
      setIsBulkDeleteModalOpen(false);
      setPendingDeleteId(null);
      toast.success('Lançamentos recorrentes excluídos!');
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || 'Erro ao excluir transações.');
      setIsBulkDeleteModalOpen(false);
    }
  };

  const getMonthName = (monthKey: string) => {
    if (monthKey === 'sem-competencia') return 'Sem Competência';
    const [year, month] = monthKey.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    const name = date.toLocaleDateString('pt-BR', { month: 'long' });
    const capitalizedMonthName = name.charAt(0).toUpperCase() + name.slice(1);
    return `${capitalizedMonthName} ${year}`;
  };

  const getMonthLabelOnly = (monthKey: string) => {
    if (monthKey === 'sem-competencia') return 'Sem Competência';
    const [year, month] = monthKey.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    const name = date.toLocaleDateString('pt-BR', { month: 'long' });
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const handleMonthChange = (val: string) => {
    setSearchParams({ month: val });
  };

  // Helper lists for filtering
  const filteredCategoriesForChips = categories.filter(c => {
    if (!c.userId) return true;
    return c.visibility === 'PERSONAL' || c.visibility === 'SHARED';
  });
  const rootCategories = filteredCategoriesForChips.filter(c => !c.parentId);
  const getSubcategories = (parentId: string) => filteredCategoriesForChips.filter(c => c.parentId === parentId);

  // Active filter chips
  const activeChips = useMemo(() => {
    const chips = [];
    if (filterAccountId) {
      const acc = accounts.find(a => a.id === filterAccountId);
      chips.push({
        id: 'account',
        label: `Conta: ${acc ? acc.name : 'Desconhecida'}`,
        onClear: () => setFilterAccountId('')
      });
    }
    if (filterCategoryId) {
      const cat = categories.find(c => c.id === filterCategoryId);
      chips.push({
        id: 'category',
        label: `Categoria: ${cat ? cat.name : 'Desconhecida'}`,
        onClear: () => setFilterCategoryId('')
      });
    }
    if (filterStatus !== 'ALL') {
      const statusLabels: Record<string, string> = {
        PAID: 'Pago',
        PLANNED: 'Planejado',
        PENDING: 'Pendente',
        OVERDUE: 'Atrasado'
      };
      chips.push({
        id: 'status',
        label: `Status: ${statusLabels[filterStatus] || filterStatus}`,
        onClear: () => setFilterStatus('ALL')
      });
    }
    if (isCouple && filterMember !== 'ALL') {
      chips.push({
        id: 'member',
        label: `Membro: ${filterMember === 'OWN' ? 'Você' : partnerName}`,
        onClear: () => setFilterMember('ALL')
      });
    }
    return chips;
  }, [filterAccountId, filterCategoryId, filterStatus, filterMember, accounts, categories, isCouple, partnerName]);

  const handleClearAllFilters = () => {
    setFilterAccountId('');
    setFilterCategoryId('');
    setFilterStatus('ALL');
    setFilterMember('ALL');
  };

  // Client-side filtering
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
      if (isCouple && filterMember !== 'ALL') {
        if (filterMember === 'OWN' && t.userId !== user?.id) return false;
        if (filterMember === 'PARTNER' && t.userId === user?.id) return false;
      }
      return true;
    });
  }, [transactions, filterStatus, filterMember, isCouple, user?.id]);

  // Group by month
  const groupedTransactions = useMemo(() => {
    return filteredTransactions.reduce<Record<string, Transaction[]>>((acc, t) => {
      const monthKey = t.competenceDate ? t.competenceDate.slice(0, 7) : 'sem-competencia';
      if (!acc[monthKey]) {
        acc[monthKey] = [];
      }
      acc[monthKey].push(t);
      return acc;
    }, {});
  }, [filteredTransactions]);

  // Sorted month keys
  const sortedMonthKeys = useMemo(() => {
    const currentMonthKey = currentCompetenceMonth();
    return Object.keys(groupedTransactions).sort((a, b) => {
      if (a === 'sem-competencia') return 1;
      if (b === 'sem-competencia') return -1;
      const isFutureA = a > currentMonthKey;
      const isFutureB = b > currentMonthKey;
      if (isFutureA && !isFutureB) return 1;
      if (!isFutureA && isFutureB) return -1;
      if (isFutureA && isFutureB) {
        return a.localeCompare(b);
      }
      return b.localeCompare(a);
    });
  }, [groupedTransactions]);

  const isMonthExpanded = (monthKey: string) => {
    if (expandedMonths[monthKey] !== undefined) {
      return expandedMonths[monthKey];
    }
    if (searchMonth !== 'ALL') return true;
    const today = new Date();
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    return monthKey === currentMonthKey;
  };

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths(prev => ({
      ...prev,
      [monthKey]: !isMonthExpanded(monthKey)
    }));
  };

  const getMonthLimit = (monthKey: string) => {
    return monthLimits[monthKey] || 20;
  };

  const handleLoadMore = (monthKey: string) => {
    setMonthLimits(prev => ({
      ...prev,
      [monthKey]: (prev[monthKey] || 20) + 20
    }));
  };

  if (!user) return null;

  return (
    <div className="gradient-bg min-h-screen text-white">
      {/* Couple context banner */}
      {isCouple && (
        <div className="bg-violet-500/10 border-b border-violet-500/20 py-2 text-center animate-in slide-in-from-top-1 duration-200">
          <span className="text-violet-300 text-xs font-medium">
            🫂 Você está vendo os lançamentos do casal ({user.name} & {partnerName})
          </span>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Transações</h1>
            <p className="text-zinc-400 text-sm mt-1">Monitore e gerencie seus lançamentos</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {searchMonth !== 'ALL' ? (
              <PeriodSelector
                value={searchMonth}
                onChange={handleMonthChange}
              />
            ) : (
              <div className="flex items-center gap-2 bg-bg-surface border border-border-subtle rounded-xl px-3 py-1.5 shadow-sm text-sm font-semibold text-zinc-305">
                <span>Busca Avançada</span>
              </div>
            )}

            {searchMonth !== 'ALL' ? (
              <button
                onClick={() => handleMonthChange('ALL')}
                className="bg-bg-surface hover:bg-bg-elevated border border-border-subtle rounded-xl px-4 py-2 text-sm font-semibold transition-all text-zinc-300"
              >
                Ver todos os meses
              </button>
            ) : (
              <button
                onClick={() => handleMonthChange(currentCompetenceMonth())}
                className="bg-brand/10 hover:bg-brand/20 border border-brand/20 text-brand rounded-xl px-4 py-2 text-sm font-semibold transition-all"
              >
                Voltar para mês atual
              </button>
            )}

            {/* Action CTA */}
            <button
              onClick={handleOpenNewTrans}
              className="bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-medium text-sm rounded-xl px-4 py-2 shadow-lg shadow-violet-500/25 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Lançamento</span>
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Filters Component */}
          <TransactionFilters
            filterAccountId={filterAccountId}
            setFilterAccountId={setFilterAccountId}
            filterCategoryId={filterCategoryId}
            setFilterCategoryId={setFilterCategoryId}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterMember={filterMember}
            setFilterMember={setFilterMember}
            accounts={accounts}
            rootCategories={rootCategories}
            getSubcategories={getSubcategories}
            isCouple={isCouple}
            partnerName={partnerName}
            activeChips={activeChips}
            handleClearAllFilters={handleClearAllFilters}
          />

          {/* Transactions List Table */}
          <div className="space-y-4 transactions-table-container">
            <TransactionTable
              accounts={accounts}
              categories={categories}
              user={user}
              isCouple={isCouple}
              partnerName={partnerName}
              searchMonth={searchMonth}
              isTransLoading={isTransLoading}
              transError={transError as Error | null}
              isSummaryLoading={isSummaryLoading}
              monthSummary={monthSummary}
              filteredTransactions={filteredTransactions}
              groupedTransactions={groupedTransactions}
              sortedMonthKeys={sortedMonthKeys}
              expandedTransactionId={expandedTransactionId}
              setExpandedTransactionId={setExpandedTransactionId}
              toggleMonth={toggleMonth}
              isMonthExpanded={isMonthExpanded}
              getMonthLimit={getMonthLimit}
              handleLoadMore={handleLoadMore}
              handleOpenNewTrans={handleOpenNewTrans}
              hasActiveFilters={activeChips.length > 0}
              onClearFilters={handleClearAllFilters}
              onEdit={handleOpenEditTrans}
              onDelete={handleDeleteTrans}
              getMonthName={getMonthName}
              getMonthLabelOnly={getMonthLabelOnly}
            />
          </div>
        </div>
      </main>

      {/* Manual Transaction Form Modal */}
      <TransactionModal
        isOpen={isTransModalOpen}
        onClose={() => setIsTransModalOpen(false)}
        editingTransaction={editingTransaction}
        accounts={accounts}
        categories={categories}
        onSubmit={handleTransFormSubmit}
        isSubmitting={false}
      />

      {/* Secondary confirmation dialogs for bulk update/delete */}
      <BulkActionModals
        isBulkUpdateOpen={isBulkUpdateModalOpen}
        onBulkUpdateClose={() => setIsBulkUpdateModalOpen(false)}
        onConfirmBulkUpdate={handleConfirmBulkUpdate}
        isBulkDeleteOpen={isBulkDeleteModalOpen}
        onBulkDeleteClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirmBulkDelete={handleConfirmBulkDelete}
      />
    </div>
  );
}
