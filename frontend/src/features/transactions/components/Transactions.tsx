import React, { useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useAccounts } from '../../accounts/hooks/useAccounts';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Calendar, AlertTriangle, 
  Trash2, Edit3, X, Info, FolderPlus, 
  DollarSign, Eye, EyeOff, Tag
} from 'lucide-react';
import type { TransactionType, TransactionStatus, TransactionVisibility, Category } from '../types';

export function Transactions() {
  const { user } = useAuth();
  const { accounts } = useAccounts();
  const { categories, createCategory, updateCategory, deleteCategory } = useCategories();
  const navigate = useNavigate();

  // Active Tab: 'list' or 'categories'
  const [activeTab, setActiveTab] = useState<'list' | 'categories'>('list');

  // Filters State
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterAccountId, setFilterAccountId] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('');

  const { transactions, isLoading: isTransLoading, error: transError, createTransaction, isCreating: isTransCreating } = useTransactions({
    startDate: filterStartDate || undefined,
    endDate: filterEndDate || undefined,
    accountId: filterAccountId || undefined,
    categoryId: filterCategoryId || undefined
  });

  // Modal State for Transaction
  const [isTransModalOpen, setIsTransModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [competenceDate, setCompetenceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [status, setStatus] = useState<TransactionStatus>('PENDING');
  const [visibility, setVisibility] = useState<TransactionVisibility>('PERSONAL');
  const [transFormError, setTransFormError] = useState<string | null>(null);

  // Modal State for Category
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [catParentId, setCatParentId] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catFormError, setCatFormError] = useState<string | null>(null);

  if (!user) return null;

  // Selected account detail to help with card info
  const selectedAccount = accounts.find(a => a.id === accountId);

  const getTodayStr = () => {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  };

  const handleOpenNewTrans = () => {
    setDescription('');
    setAmount('');
    setType('EXPENSE');
    setAccountId(accounts[0]?.id || '');
    setCategoryId('');
    setCompetenceDate('');
    setDueDate(getTodayStr());
    setPaymentDate('');
    setStatus('PENDING');
    setVisibility('PERSONAL');
    setTransFormError(null);
    setIsTransModalOpen(true);
  };

  const handleTransSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransFormError(null);

    if (!description.trim() || !amount || !accountId || !categoryId || !dueDate) {
      setTransFormError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setTransFormError('O valor deve ser maior que zero.');
      return;
    }

    if (status === 'PAID' && !paymentDate) {
      setTransFormError('A data de pagamento é obrigatória quando o status é PAGO.');
      return;
    }

    const payload = {
      accountId,
      categoryId,
      description,
      amount: numAmount,
      type,
      competenceDate: competenceDate || null,
      dueDate,
      paymentDate: status === 'PAID' ? paymentDate : null,
      status,
      visibility
    };

    try {
      await createTransaction(payload);
      setIsTransModalOpen(false);
    } catch (err) {
      const error = err as Error;
      setTransFormError(error.message || 'Erro ao criar transação.');
    }
  };

  const handleOpenNewCat = (parentId: string = '') => {
    setEditingCategory(null);
    setCatName('');
    setCatParentId(parentId);
    setCatFormError(null);
    setIsCatModalOpen(true);
  };

  const handleOpenEditCat = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatParentId(cat.parentId || '');
    setCatFormError(null);
    setIsCatModalOpen(true);
  };

  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatFormError(null);

    if (!catName.trim()) {
      setCatFormError('O nome da categoria é obrigatório.');
      return;
    }

    try {
      const payload = {
        name: catName,
        parentId: catParentId || null
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
  const rootCategories = categories.filter(c => !c.parentId);
  const getSubcategories = (parentId: string) => categories.filter(c => c.parentId === parentId);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: user.currency,
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const getStatusLabel = (s: TransactionStatus) => {
    switch (s) {
      case 'PAID': return 'Pago';
      case 'PENDING': return 'Pendente';
      case 'PLANNED': return 'Planejado';
      case 'OVERDUE': return 'Atrasado';
      default: return s;
    }
  };

  const getStatusColor = (s: TransactionStatus) => {
    switch (s) {
      case 'PAID': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'PENDING': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'PLANNED': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'OVERDUE': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-zinc-800 text-zinc-400';
    }
  };

  return (
    <div className="gradient-bg min-h-screen text-white">
      {/* Navbar */}
      <nav className="glassmorphism sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/50 transition-all flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Painel</span>
          </button>
          
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === 'list' ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-400 hover:text-white'}`}
            >
              Lançamentos
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === 'categories' ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-400 hover:text-white'}`}
            >
              Gerenciar Categorias
            </button>
          </div>

          <button
            onClick={handleOpenNewTrans}
            className="bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-medium text-sm rounded-xl px-4 py-2 shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'list' ? (
          <div className="space-y-6">
            {/* Filters Box */}
            <div className="auth-card p-6 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
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
            </div>

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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50 text-sm text-zinc-300">
                      {transactions.map((t) => {
                        const acc = accounts.find(a => a.id === t.accountId);
                        const cat = categories.find(c => c.id === t.categoryId);
                        return (
                          <tr key={t.id} className="hover:bg-zinc-800/20 transition-colors">
                            <td className="p-4 font-medium text-white">{t.description}</td>
                            <td className="p-4 text-zinc-400">{acc ? acc.name : 'Conta excluída'}</td>
                            <td className="p-4 text-zinc-400">{cat ? cat.name : 'Sem Categoria'}</td>
                            <td className="p-4 text-zinc-400">{formatDate(t.competenceDate)}</td>
                            <td className="p-4 text-zinc-400">{formatDate(t.dueDate)}</td>
                            <td className="p-4 text-zinc-400">{formatDate(t.paymentDate || '')}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(t.status)}`}>
                                {getStatusLabel(t.status)}
                              </span>
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
                            <td className={`p-4 text-right font-bold ${t.type === 'EXPENSE' ? 'text-red-400' : 'text-emerald-400'}`}>
                              {t.type === 'EXPENSE' ? '-' : '+'}{formatCurrency(t.amount)}
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
                  {rootCategories.map(parent => (
                    <div key={parent.id} className="border border-zinc-800/80 rounded-xl p-4 bg-zinc-900/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-violet-400 text-sm tracking-tight">{parent.name}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenNewCat(parent.id)}
                            title="Nova Subcategoria"
                            className="p-1 hover:text-white text-zinc-400 hover:bg-zinc-800 rounded transition-colors"
                          >
                            <FolderPlus className="w-4 h-4" />
                          </button>
                          {parent.userId && (
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
                        {getSubcategories(parent.id).map(sub => (
                          <div key={sub.id} className="flex items-center justify-between text-xs py-1 group/sub text-zinc-300">
                            <span>{sub.name}</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                              {sub.userId && (
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
                        {getSubcategories(parent.id).length === 0 && (
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

            <form onSubmit={handleTransSubmit} className="space-y-4">
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
                      onClick={() => setType('EXPENSE')}
                      className={`py-2 text-sm font-semibold rounded-xl border transition-all ${type === 'EXPENSE' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                    >
                      Despesa
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('INCOME')}
                      className={`py-2 text-sm font-semibold rounded-xl border transition-all ${type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                    >
                      Receita
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">Valor</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500 text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">Descrição</label>
                <input
                  type="text"
                  placeholder="Ex: Supermercado do mês"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500 text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">Conta Origem</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500 text-zinc-100"
                  >
                    <option value="">Selecione...</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.bank})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">Categoria</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500 text-zinc-100"
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
                  </select>
                </div>
              </div>

              {selectedAccount?.type === 'CREDIT_CARD' && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs rounded-xl flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">Sugeridor de Competência Ativo (Cartão)</span>
                    A data de competência será calculada automaticamente com base no fechamento do cartão (dia {selectedAccount.closingDay}). Se lançado após o fechamento, o gasto pertencerá ao ciclo do próximo mês.
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">Vencimento</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500 text-zinc-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2 flex items-center gap-1">
                    Competência
                    <span title="Mês do orçamento deste gasto" className="cursor-help text-zinc-500 font-normal">?</span>
                  </label>
                  <input
                    type="date"
                    value={competenceDate}
                    onChange={(e) => setCompetenceDate(e.target.value)}
                    placeholder="Sugerido automático"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500 text-zinc-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">Data Pagamento</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    disabled={status !== 'PAID'}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500 text-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">Status</label>
                  <select
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value as TransactionStatus);
                      if (e.target.value !== 'PAID') {
                        setPaymentDate('');
                      } else {
                        setPaymentDate(getTodayStr());
                      }
                    }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500 text-zinc-100"
                  >
                    <option value="PLANNED">Planejado</option>
                    <option value="PENDING">Pendente</option>
                    <option value="PAID">Pago</option>
                    <option value="OVERDUE">Atrasado</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">Visibilidade</label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as TransactionVisibility)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500 text-zinc-100"
                  >
                    <option value="PERSONAL">Pessoal (Privado)</option>
                    <option value="SHARED">Compartilhado (Casal)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-zinc-800 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsTransModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isTransCreating}
                  className="bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-semibold text-sm rounded-xl px-5 py-2 transition-all disabled:opacity-50"
                >
                  {isTransCreating ? 'Salvando...' : 'Salvar Lançamento'}
                </button>
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

            <form onSubmit={handleCatSubmit} className="space-y-4">
              {catFormError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{catFormError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">Nome da Categoria</label>
                <input
                  type="text"
                  placeholder="Ex: Uber, Feira, Energia..."
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500 text-zinc-100"
                />
              </div>

              {!editingCategory && (
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">Categoria Pai (Opcional)</label>
                  <select
                    value={catParentId}
                    onChange={(e) => setCatParentId(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500 text-zinc-100"
                  >
                    <option value="">Nenhuma (Categoria Principal)</option>
                    {rootCategories.map(parent => (
                      <option key={parent.id} value={parent.id}>{parent.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-zinc-800 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-semibold text-sm rounded-xl px-5 py-2 transition-all"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
