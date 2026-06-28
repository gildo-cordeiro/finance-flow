import React, { useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useAccounts } from '../../accounts/hooks/useAccounts';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import { 
  Plus, Calendar, AlertTriangle, 
  Trash2, Edit3, X, Info, FolderPlus, 
  DollarSign, Eye, EyeOff, Tag, RefreshCw, Layers
} from 'lucide-react';
import type { TransactionStatus, Category, Transaction, TransactionPayload } from '../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { MoneyValue } from '../../../components/ui/MoneyValue';
import { useView } from '../../../context/ViewContext';
import { useCouple } from '../../couple/hooks/useCouple';
import { cn } from '../../../lib/cn';

const transactionSchema = z.object({
  type: z.enum(['EXPENSE', 'INCOME']),
  amount: z.coerce.number().positive('O valor deve ser maior que zero'),
  description: z.string().min(1, 'A descrição é obrigatória'),
  accountId: z.string().min(1, 'A conta é obrigatória'),
  categoryId: z.string().min(1, 'A categoria é obrigatória'),
  dueDate: z.string().min(1, 'A data de vencimento é obrigatória'),
  competenceDate: z.string().optional().or(z.literal('')),
  paymentDate: z.string().optional().or(z.literal('')),
  status: z.enum(['PLANNED', 'PENDING', 'PAID', 'OVERDUE']),
  visibility: z.enum(['PERSONAL', 'SHARED']),
  repetitionType: z.enum(['SINGLE', 'INSTALLMENT', 'RECURRING']).default('SINGLE'),
  totalInstallments: z.coerce.number().optional().nullable(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: z.string().optional().nullable(),
}).refine((data) => {
  if (data.status === 'PAID') {
    return !!data.paymentDate;
  }
  return true;
}, {
  message: 'A data de pagamento é obrigatória quando o status é PAGO',
  path: ['paymentDate'],
}).refine((data) => {
  if (data.repetitionType === 'INSTALLMENT') {
    return !!data.totalInstallments && data.totalInstallments > 1;
  }
  return true;
}, {
  message: 'O número de parcelas deve ser maior que 1',
  path: ['totalInstallments'],
});

type TransactionFormData = z.infer<typeof transactionSchema>;

const categorySchema = z.object({
  name: z.string().min(1, 'O nome da categoria é obrigatório'),
  parentId: z.string().optional().nullable().or(z.literal('')),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export function Transactions() {
  const { user } = useAuth();
  const { accounts } = useAccounts();
  const { categories, createCategory, updateCategory, deleteCategory } = useCategories();
  const { viewContext } = useView();
  const { coupleStatus } = useCouple();

  const isCouple = viewContext === 'COUPLE';
  const partnerName = coupleStatus.partnerName || 'Parceiro(a)';

  // Active Tab: 'list' or 'categories'
  const [activeTab, setActiveTab] = useState<'list' | 'categories'>('list');

  // Filters State
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterAccountId, setFilterAccountId] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('');

  const {
    transactions,
    isLoading: isTransLoading,
    error: transError,
    createTransaction,
    isCreating: isTransCreating,
    updateTransaction,
    deleteTransaction,
  } = useTransactions({
    startDate: filterStartDate || undefined,
    endDate: filterEndDate || undefined,
    accountId: filterAccountId || undefined,
    categoryId: filterCategoryId || undefined
  });

  // Modal State for Transaction
  const [isTransModalOpen, setIsTransModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [transFormError, setTransFormError] = useState<string | null>(null);

  // Bulk actions states
  const [isBulkUpdateModalOpen, setIsBulkUpdateModalOpen] = useState(false);
  const [pendingUpdatePayload, setPendingUpdatePayload] = useState<TransactionPayload | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Modal State for Category
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catFormError, setCatFormError] = useState<string | null>(null);

  const getTodayStr = () => {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  };

  // Transaction form configuration
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
      type: 'EXPENSE',
      amount: 0,
      description: '',
      accountId: '',
      categoryId: '',
      competenceDate: '',
      dueDate: getTodayStr(),
      paymentDate: '',
      status: 'PENDING',
      visibility: 'PERSONAL',
      repetitionType: 'SINGLE',
      totalInstallments: null,
      isRecurring: false,
      recurrenceRule: 'MONTHLY',
    }
  });

  const watchedRepetitionType = watchTrans('repetitionType');
  const watchedAccountId = watchTrans('accountId');
  const watchedType = watchTrans('type');
  const watchedVisibility = watchTrans('visibility');

  // Derived helper for filtered lists (form transaction registration)
  const filteredCategories = categories.filter(c => {
    if (!c.userId) return true; // System categories
    return c.visibility === watchedVisibility;
  });

  const rootCategories = filteredCategories.filter(c => !c.parentId);
  const getSubcategories = (parentId: string) => filteredCategories.filter(c => c.parentId === parentId);

  // Derived helper for Category Tab (all categories of the current view context)
  const rootCategoriesAll = categories.filter(c => !c.parentId);
  const getSubcategoriesAll = (parentId: string) => categories.filter(c => c.parentId === parentId);
  const watchedStatus = watchTrans('status');

  const selectedAccount = accounts.find(a => a.id === watchedAccountId);

  // Category form configuration
  const {
    register: registerCat,
    handleSubmit: handleCatSubmitForm,
    reset: resetCat,
    formState: { errors: errorsCat },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      parentId: '',
    }
  });

  if (!user) return null;

  const handleOpenNewTrans = () => {
    setEditingTransaction(null);
    resetTrans({
      type: 'EXPENSE',
      amount: 0,
      description: '',
      accountId: accounts[0]?.id || '',
      categoryId: '',
      competenceDate: '',
      dueDate: getTodayStr(),
      paymentDate: '',
      status: 'PENDING',
      visibility: 'PERSONAL',
      repetitionType: 'SINGLE',
      totalInstallments: null,
      isRecurring: false,
      recurrenceRule: 'MONTHLY',
    });
    setTransFormError(null);
    setIsTransModalOpen(true);
  };

  const handleOpenEditTrans = (t: Transaction) => {
    setEditingTransaction(t);

    let repetitionType: 'SINGLE' | 'INSTALLMENT' | 'RECURRING' = 'SINGLE';
    if (t.installmentGroupId) repetitionType = 'INSTALLMENT';
    else if (t.isRecurring) repetitionType = 'RECURRING';

    resetTrans({
      type: t.type,
      amount: t.amount,
      description: t.description,
      accountId: t.accountId,
      categoryId: t.categoryId,
      competenceDate: t.competenceDate || '',
      dueDate: t.dueDate,
      paymentDate: t.paymentDate || '',
      status: t.status,
      visibility: t.visibility,
      repetitionType,
      totalInstallments: t.totalInstallments || null,
      isRecurring: t.isRecurring,
      recurrenceRule: t.recurrenceRule || 'MONTHLY',
    });
    setTransFormError(null);
    setIsTransModalOpen(true);
  };

  const handleTransFormSubmit = async (data: TransactionFormData) => {
    setTransFormError(null);

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
      totalInstallments: data.repetitionType === 'INSTALLMENT' ? Number(data.totalInstallments) : null,
      isRecurring: data.repetitionType === 'RECURRING',
      recurrenceRule: data.repetitionType === 'RECURRING' ? data.recurrenceRule || 'MONTHLY' : null,
    };

    try {
      if (editingTransaction) {
        if (editingTransaction.installmentGroupId || editingTransaction.recurrenceGroupId) {
          setPendingUpdatePayload(payload);
          setIsBulkUpdateModalOpen(true);
        } else {
          await updateTransaction(editingTransaction.id, payload, 'ONLY_THIS');
          setIsTransModalOpen(false);
          setEditingTransaction(null);
        }
      } else {
        await createTransaction(payload);
        setIsTransModalOpen(false);
      }
    } catch (err) {
      const error = err as Error;
      setTransFormError(error.message || 'Erro ao salvar transação.');
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
    } catch (err) {
      const error = err as Error;
      setTransFormError(error.message || 'Erro ao atualizar transações.');
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
        } catch (err) {
          const error = err as Error;
          alert(error.message || 'Erro ao excluir transação.');
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
    } catch (err) {
      const error = err as Error;
      alert(error.message || 'Erro ao excluir transações.');
      setIsBulkDeleteModalOpen(false);
    }
  };

  const handleOpenNewCat = (parentId: string = '') => {
    setEditingCategory(null);
    resetCat({
      name: '',
      parentId: parentId,
    });
    setCatFormError(null);
    setIsCatModalOpen(true);
  };

  const handleOpenEditCat = (cat: Category) => {
    setEditingCategory(cat);
    resetCat({
      name: cat.name,
      parentId: cat.parentId || '',
    });
    setCatFormError(null);
    setIsCatModalOpen(true);
  };

  const handleCatFormSubmit = async (data: CategoryFormData) => {
    setCatFormError(null);

    try {
      const payload = {
        name: data.name,
        parentId: data.parentId || null
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id, payload);
      } else {
        await createCategory(payload);
      }
      setIsCatModalOpen(false);
    } catch (err) {
      const error = err as Error;
      setCatFormError(error.message || 'Erro ao salvar categoria.');
    }
  };

  const handleDeleteCat = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria? As subcategorias e transações vinculadas serão afetadas.')) {
      try {
        await deleteCategory(id);
      } catch (err) {
        const error = err as Error;
        alert(error.message || 'Erro ao excluir categoria.');
      }
    }
  };

  // Helper selectors
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="gradient-bg min-h-screen text-white">
      {/* Couple context banner — visible only in COUPLE mode */}
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
            <p className="text-zinc-400 text-sm mt-1">Monitore e gerencie seus lançamentos e categorias</p>
          </div>
          
          <div className="flex items-center gap-3 self-start sm:self-center">
            {/* Tabs */}
            <div className="flex bg-bg-surface border border-border-subtle p-1 rounded-xl shadow-lg">
              <button
                onClick={() => setActiveTab('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'list'
                    ? 'bg-zinc-800 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Lançamentos
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'categories'
                    ? 'bg-zinc-800 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Categorias
              </button>
            </div>

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

        {activeTab === 'list' ? (
          <div className="space-y-6">
            {/* Filters Box */}
            <Card className="p-6 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">Conta</label>
                <select
                  value={filterAccountId}
                  onChange={(e) => setFilterAccountId(e.target.value)}
                  className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500 text-zinc-100"
                >
                  <option value="">Todas as contas</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.bank})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">Categoria</label>
                <select
                  value={filterCategoryId}
                  onChange={(e) => setFilterCategoryId(e.target.value)}
                  className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500 text-zinc-100"
                >
                  <option value="">Todas as categorias</option>
                  {rootCategories.map(parent => (
                    <React.Fragment key={parent.id}>
                      <option value={parent.id} className="font-bold text-violet-400">{parent.name}</option>
                      {getSubcategories(parent.id).map(sub => (
                        <option key={sub.id} value={sub.id}>&nbsp;&nbsp;&nbsp;&nbsp;{sub.name}</option>
                      ))}
                    </React.Fragment>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">Início Competência</label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500 text-zinc-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">Fim Competência</label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500 text-zinc-100"
                />
              </div>
            </Card>

            {/* Transactions List */}
            <div className="auth-card overflow-hidden">
              {isTransLoading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="w-10 h-10 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
                </div>
              ) : transError ? (
                <div className="p-6 text-center text-red-400 space-y-2">
                  <AlertTriangle className="w-10 h-10 mx-auto" />
                  <p>Erro ao carregar lançamentos.</p>
                  <p className="text-xs text-red-400/80">{transError.message}</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="p-20 text-center text-zinc-500 space-y-4">
                  <Calendar className="w-12 h-12 mx-auto text-zinc-600" />
                  <p className="text-lg font-semibold">Nenhuma transação encontrada</p>
                  <p className="text-sm text-zinc-500">Ajuste os filtros ou crie um novo lançamento.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                     <thead>
                      <tr className="border-b border-zinc-800 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                        <th className="p-4">Descrição</th>
                        <th className="p-4">Conta</th>
                        <th className="p-4">Categoria</th>
                        <th className="p-4">Competência</th>
                        <th className="p-4">Vencimento</th>
                        <th className="p-4">Pagamento</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Visibilidade</th>
                        <th className="p-4 text-right">Valor</th>
                        <th className="p-4 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50 text-sm text-zinc-300">
                      {transactions.map((t) => {
                        const acc = accounts.find(a => a.id === t.accountId);
                        const cat = categories.find(c => c.id === t.categoryId);
                        return (
                          <tr key={t.id} className="hover:bg-zinc-800/20 transition-colors">
                            <td className="p-4 font-medium text-white">
                              <div className="flex items-center gap-2">
                                <span>{t.description}</span>
                                {t.installmentGroupId && (
                                  <span title="Lançamento Parcelado"><Layers className="w-3.5 h-3.5 text-blue-400" /></span>
                                )}
                                {t.isRecurring && (
                                  <span title="Lançamento Recorrente"><RefreshCw className="w-3.5 h-3.5 text-emerald-400" /></span>
                                )}
                                {isCouple && (
                                  <span className={cn(
                                    "text-[10px] font-bold px-1.5 py-0.5 rounded border",
                                    t.userId === user.id 
                                      ? "bg-violet-500/10 border-violet-500/20 text-violet-300"
                                      : "bg-pink-500/10 border-pink-500/20 text-pink-300"
                                  )}>
                                    {t.userId === user.id ? 'Você' : partnerName}
                                  </span>
                                )}
                              </div>
                            </td>
                             <td className="p-4 text-zinc-400">
                               {acc ? acc.name : (t.userId !== user?.id ? 'Conta do Parceiro' : 'Conta excluída')}
                             </td>
                             <td className="p-4 text-zinc-400">
                               {cat ? cat.name : (t.userId !== user?.id ? 'Categoria do Parceiro' : 'Sem Categoria')}
                             </td>
                            <td className="p-4 text-zinc-400">{formatDate(t.competenceDate)}</td>
                            <td className="p-4 text-zinc-400">{formatDate(t.dueDate)}</td>
                            <td className="p-4 text-zinc-400">{formatDate(t.paymentDate || '')}</td>
                            <td className="p-4">
                              <Badge status={t.status} />
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1.5 text-zinc-400">
                                {t.visibility === 'SHARED' ? (
                                  <>
                                    <Eye className="w-3.5 h-3.5 text-violet-400" />
                                    <span>Compartilhado</span>
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="w-3.5 h-3.5" />
                                    <span>Pessoal</span>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <MoneyValue amount={t.type === 'EXPENSE' ? -t.amount : t.amount} />
                            </td>
                             <td className="p-4 text-center">
                              {t.userId === user.id ? (
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleOpenEditTrans(t)}
                                    className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                                    title="Editar"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTrans(t)}
                                    className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-red-400 transition-colors"
                                    title="Excluir"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-zinc-500 italic select-none" title="Você não pode alterar transações criadas pelo parceiro">Somente leitura</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Categories Management Tab */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Category Tree */}
            <div className="auth-card p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Tag className="w-5 h-5 text-violet-400" />
                  <span>Estrutura de Categorias</span>
                </h3>
                <button
                  onClick={() => handleOpenNewCat('')}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs rounded-xl px-3 py-1.5 border border-zinc-700 transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Grupo</span>
                </button>
              </div>

              {categories.length === 0 ? (
                <p className="text-zinc-500 text-sm">Nenhuma categoria cadastrada.</p>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {rootCategoriesAll.map(parent => (
                    <div key={parent.id} className="border border-zinc-800/80 rounded-xl p-4 bg-zinc-900/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-violet-400 text-sm tracking-tight">{parent.name}</span>
                          {isCouple && parent.userId && (
                            <span className={cn(
                              "text-[8px] font-bold px-1.5 py-0.5 rounded border select-none font-sans leading-none",
                              parent.userId === user.id 
                                ? "bg-violet-500/10 border-violet-500/20 text-violet-300"
                                : "bg-pink-500/10 border-pink-500/20 text-pink-300"
                            )}>
                              {parent.userId === user.id ? 'Você' : partnerName}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenNewCat(parent.id)}
                            title="Nova Subcategoria"
                            className="p-1 hover:text-white text-zinc-400 hover:bg-zinc-800 rounded transition-colors"
                          >
                            <FolderPlus className="w-4 h-4" />
                          </button>
                          {parent.userId === user.id && (
                            <>
                              <button
                                onClick={() => handleOpenEditCat(parent)}
                                title="Editar"
                                className="p-1 hover:text-white text-zinc-400 hover:bg-zinc-800 rounded transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCat(parent.id)}
                                title="Excluir"
                                className="p-1 hover:text-red-400 text-zinc-400 hover:bg-red-500/10 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Subcategories list */}
                      <div className="pl-4 border-l border-zinc-800 space-y-2">
                        {getSubcategoriesAll(parent.id).map(sub => (
                          <div key={sub.id} className="flex items-center justify-between text-xs py-1 group/sub text-zinc-300">
                            <div className="flex items-center gap-2">
                              <span>{sub.name}</span>
                              {isCouple && sub.userId && (
                                <span className={cn(
                                  "text-[8px] font-bold px-1.5 py-0.5 rounded border select-none font-sans leading-none",
                                  sub.userId === user.id 
                                    ? "bg-violet-500/10 border-violet-500/20 text-violet-300"
                                    : "bg-pink-500/10 border-pink-500/20 text-pink-300"
                                )}>
                                  {sub.userId === user.id ? 'Você' : partnerName}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                              {sub.userId === user.id && (
                                <>
                                  <button
                                    onClick={() => handleOpenEditCat(sub)}
                                    className="p-1 hover:text-white text-zinc-500 hover:bg-zinc-800 rounded"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCat(sub.id)}
                                    className="p-1 hover:text-red-400 text-zinc-500 hover:bg-red-500/15 rounded"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                        {getSubcategoriesAll(parent.id).length === 0 && (
                          <span className="text-zinc-500 text-xs italic">Sem subcategorias</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Categories Information details */}
            <div className="auth-card p-6 space-y-6 self-start">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-400" />
                <span>Sobre as Categorias</span>
              </h3>
              
              <div className="space-y-4 text-sm text-zinc-400 leading-relaxed">
                <p>
                  As categorias do FinanceFlow dividem-se em duas camadas: **Categorias Principais (Grupos)** e **Subcategorias**.
                </p>
                <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800 text-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-violet-400 rounded-full"></span>
                    <strong>Categorias de Sistema:</strong> Disponibilizadas por padrão (Receitas, Alimentação, Moradia, etc.) e não podem ser editadas ou excluídas.
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                    <strong>Categorias Customizadas:</strong> Criadas por você para organizar seus orçamentos. Podem ser editadas e excluídas livremente.
                  </div>
                </div>
                <p>
                  Sempre lance despesas vinculadas a subcategorias (por exemplo, em vez de selecionar "Alimentação", selecione "Alimentação &gt; Supermercado") para obter relatórios e análises financeiras mais precisas.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Manual Transaction Modal */}
      {isTransModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="auth-card w-full max-w-lg p-6 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-violet-400" />
                Registrar Lançamento Manual
              </h2>
              <button onClick={() => setIsTransModalOpen(false)} className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransSubmit(handleTransFormSubmit)} className="space-y-4">
              {transFormError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{transFormError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">Tipo de Lançamento</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setValueTrans('type', 'EXPENSE')}
                      className={`py-2 text-sm font-semibold rounded-xl border transition-all ${watchedType === 'EXPENSE' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                    >
                      Despesa
                    </button>
                    <button
                      type="button"
                      onClick={() => setValueTrans('type', 'INCOME')}
                      className={`py-2 text-sm font-semibold rounded-xl border transition-all ${watchedType === 'INCOME' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                    >
                      Receita
                    </button>
                  </div>
                </div>

                <Input
                  type="number"
                  step="0.01"
                  label="Valor"
                  placeholder="0,00"
                  error={errorsTrans.amount?.message}
                  {...registerTrans('amount')}
                />
              </div>

              <Input
                type="text"
                label="Descrição"
                placeholder="Ex: Supermercado do mês"
                error={errorsTrans.description?.message}
                {...registerTrans('description')}
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Conta Origem"
                  error={errorsTrans.accountId?.message}
                  {...registerTrans('accountId')}
                >
                  <option value="">Selecione...</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.bank})</option>
                  ))}
                </Select>

                <Select
                  label="Categoria"
                  error={errorsTrans.categoryId?.message}
                  {...registerTrans('categoryId')}
                >
                  <option value="">Selecione...</option>
                  {rootCategories.map(parent => (
                    <React.Fragment key={parent.id}>
                      <option value={parent.id} className="font-bold text-violet-400" disabled>{parent.name}</option>
                      {getSubcategories(parent.id).map(sub => (
                        <option key={sub.id} value={sub.id}>&nbsp;&nbsp;&nbsp;&nbsp;{sub.name}</option>
                      ))}
                    </React.Fragment>
                  ))}
                </Select>
              </div>

              {selectedAccount?.type === 'CREDIT_CARD' && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs rounded-xl flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">Gestão Inteligente de Fatura Ativa</span>
                    O sistema calculará a competência baseando-se no fechamento (dia {selectedAccount.closingDay}). O vencimento e o pagamento deste lançamento serão definidos automaticamente para o dia de vencimento da fatura correspondente (dia {selectedAccount.dueDay}), garantindo a precisão do seu Fluxo de Caixa.
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <Input
                  type="date"
                  label="Vencimento"
                  error={errorsTrans.dueDate?.message}
                  {...registerTrans('dueDate')}
                />

                <Input
                  type="date"
                  label="Competência"
                  error={errorsTrans.competenceDate?.message}
                  {...registerTrans('competenceDate')}
                />

                <Input
                  type="date"
                  label="Data Pagamento"
                  error={errorsTrans.paymentDate?.message}
                  disabled={watchedStatus !== 'PAID'}
                  {...registerTrans('paymentDate')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Repetição"
                  error={errorsTrans.repetitionType?.message}
                  disabled={!!editingTransaction}
                  {...registerTrans('repetitionType')}
                >
                  <option value="SINGLE">Único</option>
                  <option value="INSTALLMENT">Parcelado</option>
                  <option value="RECURRING">Fixo Mensal</option>
                </Select>

                {watchedRepetitionType === 'INSTALLMENT' && (
                  <Input
                    type="number"
                    label="Nº de Parcelas"
                    placeholder="Ex: 3"
                    disabled={!!editingTransaction}
                    error={errorsTrans.totalInstallments?.message}
                    {...registerTrans('totalInstallments')}
                  />
                )}

                {watchedRepetitionType === 'RECURRING' && (
                  <Select
                    label="Frequência"
                    disabled={!!editingTransaction}
                    error={errorsTrans.recurrenceRule?.message}
                    {...registerTrans('recurrenceRule')}
                  >
                    <option value="MONTHLY">Mensal</option>
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
                    if (newStatus !== 'PAID') {
                      setValueTrans('paymentDate', '');
                    } else {
                      setValueTrans('paymentDate', getTodayStr());
                    }
                  }}
                >
                  <option value="PLANNED">Planejado</option>
                  <option value="PENDING">Pendente</option>
                  <option value="PAID">Pago</option>
                  <option value="OVERDUE">Atrasado</option>
                </Select>

                <Select
                  label="Visibilidade"
                  error={errorsTrans.visibility?.message}
                  {...registerTrans('visibility')}
                >
                  <option value="PERSONAL">Pessoal (Privado)</option>
                  <option value="SHARED">Compartilhado (Casal)</option>
                </Select>
              </div>

              <div className="flex justify-end gap-3 border-t border-zinc-800 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsTransModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <Button
                  type="submit"
                  loading={isTransCreating}
                >
                  Salvar Lançamento
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal (Create/Edit) */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="auth-card w-full max-w-md p-6 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Tag className="w-5 h-5 text-violet-400" />
                {editingCategory ? 'Editar Categoria' : 'Criar Categoria'}
              </h2>
              <button onClick={() => setIsCatModalOpen(false)} className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCatSubmitForm(handleCatFormSubmit)} className="space-y-4">
              {catFormError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{catFormError}</span>
                </div>
              )}

              <Input
                type="text"
                label="Nome da Categoria"
                placeholder="Ex: Uber, Feira, Energia..."
                error={errorsCat.name?.message}
                {...registerCat('name')}
              />

              {!editingCategory && (
                <Select
                  label="Categoria Pai (Opcional)"
                  error={errorsCat.parentId?.message}
                  {...registerCat('parentId')}
                >
                  <option value="">Nenhuma (Categoria Principal)</option>
                  {rootCategories.map(parent => (
                    <option key={parent.id} value={parent.id}>{parent.name}</option>
                  ))}
                </Select>
              )}

              <div className="flex justify-end gap-3 border-t border-zinc-800 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <Button
                  type="submit"
                >
                  Salvar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Update Modal */}
      {isBulkUpdateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="auth-card w-full max-w-md p-6 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Info className="w-5 h-5 text-violet-400" />
                Editar Lançamento Recorrente
              </h2>
              <button onClick={() => setIsBulkUpdateModalOpen(false)} className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-zinc-300">
              Este lançamento faz parte de um grupo (parcelamento ou recorrência). Deseja atualizar apenas este lançamento ou todos os lançamentos do grupo?
            </p>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleConfirmBulkUpdate('ONLY_THIS')}
                className="w-full py-2.5 bg-zinc-850 hover:bg-zinc-800 active:bg-zinc-900 border border-zinc-700 text-sm font-semibold rounded-xl transition-all"
              >
                Atualizar apenas este
              </button>
              <button
                type="button"
                onClick={() => handleConfirmBulkUpdate('ALL')}
                className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-sm font-semibold rounded-xl shadow-lg shadow-violet-500/25 transition-all"
              >
                Atualizar toda a série
              </button>
              <button
                type="button"
                onClick={() => setIsBulkUpdateModalOpen(false)}
                className="w-full py-2.5 text-zinc-400 hover:text-white text-sm font-semibold transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="auth-card w-full max-w-md p-6 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h2 className="text-xl font-bold flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-5 h-5" />
                Excluir Lançamento Recorrente
              </h2>
              <button onClick={() => setIsBulkDeleteModalOpen(false)} className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-zinc-300">
              Este lançamento faz parte de um grupo (parcelamento ou recorrência). Deseja excluir apenas este lançamento ou todos os lançamentos do grupo?
            </p>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleConfirmBulkDelete('ONLY_THIS')}
                className="w-full py-2.5 bg-zinc-850 hover:bg-zinc-800 active:bg-zinc-900 border border-zinc-700 text-sm font-semibold rounded-xl transition-all"
              >
                Excluir apenas este
              </button>
              <button
                type="button"
                onClick={() => handleConfirmBulkDelete('ALL')}
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-sm font-semibold rounded-xl shadow-lg shadow-red-500/25 transition-all"
              >
                Excluir toda a série
              </button>
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="w-full py-2.5 text-zinc-400 hover:text-white text-sm font-semibold transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
