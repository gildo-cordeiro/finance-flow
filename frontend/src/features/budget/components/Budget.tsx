import React, { useState } from 'react';
import { useBudget } from '../hooks/useBudget';
import { useAuth } from '../../auth/hooks/useAuth';
import { 
  ChevronLeft, ChevronRight,
  Copy, Edit2, Check, X, AlertTriangle, Plus, Tag,
  TrendingUp, PiggyBank, Wallet, Lock
} from 'lucide-react';
import { useView } from '../../../context/ViewContext';
import { useCouple } from '../../couple/hooks/useCouple';
import { cn } from '../../../lib/cn';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Input } from '../../../components/ui/Input';

export function Budget() {
  const { user } = useAuth();
  const { viewContext } = useView();
  const { coupleStatus } = useCouple();

  const isCouple = viewContext === 'COUPLE';
  const partnerName = coupleStatus.partnerName || 'Parceiro(a)';

  // Initialize with current month in YYYY-MM format
  const getInitialMonth = () => {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${month}`;
  };

  const [currentMonth, setCurrentMonth] = useState(getInitialMonth());
  const { 
    budget, isLoading, error, updatePlannedAmount, 
    copyPreviousBudget, isCopying 
  } = useBudget(currentMonth);

  // Inline editing state
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  // Collapsed categories state
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // New budget modal state
  const [isNewBudgetModalOpen, setIsNewBudgetModalOpen] = useState(false);
  const [newBudgetCategoryId, setNewBudgetCategoryId] = useState('');
  const [newBudgetAmount, setNewBudgetAmount] = useState('');
  const [newBudgetError, setNewBudgetError] = useState<string | null>(null);

  if (!user) return null;

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    setCurrentMonth(`${newYear}-${newMonth}`);
    setEditingCategoryId(null);
  };

  const handleNextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month, 1);
    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    setCurrentMonth(`${newYear}-${newMonth}`);
    setEditingCategoryId(null);
  };

  const formatMonthLabel = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: user.currency || 'BRL',
    }).format(val);
  };

  // Start inline editing
  const startEditing = (categoryId: string, currentPlanned: number) => {
    setEditingCategoryId(categoryId);
    setEditValue(currentPlanned.toString());
    setSaveError(null);
  };

  const handleSave = async (categoryId: string) => {
    setSaveError(null);
    const num = parseFloat(editValue);
    if (isNaN(num) || num < 0) {
      setSaveError('Valor inválido');
      return;
    }

    try {
      await updatePlannedAmount(categoryId, num);
      setEditingCategoryId(null);
    } catch {
      setSaveError('Erro ao salvar');
    }
  };

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Totals calculations
  const totalPlanned = budget?.items.reduce((sum, item) => sum + item.plannedAmount, 0) || 0;
  const totalRealized = budget?.items.reduce((sum, item) => sum + item.realizedAmount, 0) || 0;
  const totalRemaining = totalPlanned - totalRealized;

  const handleCopy = async () => {
    if (window.confirm('Deseja copiar o planejamento do mês anterior para este mês? Os valores existentes serão mesclados.')) {
      try {
        await copyPreviousBudget();
      } catch {
        alert('Erro ao copiar orçamento anterior.');
      }
    }
  };

  const handleNewBudgetSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewBudgetError(null);
    if (!newBudgetCategoryId) {
      setNewBudgetError('Selecione uma categoria');
      return;
    }
    const amt = parseFloat(newBudgetAmount);
    if (isNaN(amt) || amt < 0) {
      setNewBudgetError('Valor inválido');
      return;
    }
    try {
      await updatePlannedAmount(newBudgetCategoryId, amt);
      setIsNewBudgetModalOpen(false);
      setNewBudgetCategoryId('');
      setNewBudgetAmount('');
      setNewBudgetError(null);
    } catch {
      setNewBudgetError('Erro ao salvar orçamento');
    }
  };

  // Separate parent and child categories for structured view
  const rootCategories = budget?.items.filter(item => !item.parentCategoryId) || [];
  const subCategories = budget?.items.filter(item => item.parentCategoryId) || [];

  // Dropdown options helper for hierarchy select
  const getSortedCategoryOptions = () => {
    if (!budget) return [];
    const roots = budget.items.filter(item => !item.parentCategoryId);
    const children = budget.items.filter(item => item.parentCategoryId);
    
    const options: { id: string; name: string }[] = [];
    roots.forEach(root => {
      options.push({ id: root.categoryId, name: root.categoryName });
      const subCats = children.filter(child => child.parentCategoryId === root.categoryId);
      subCats.forEach(sub => {
        options.push({ id: sub.categoryId, name: `  └─ ${sub.categoryName}` });
      });
    });
    return options;
  };

  return (
    <div className="gradient-bg min-h-screen text-white">
      {/* Couple context banner — visible only in COUPLE mode */}
      {isCouple && (
        <div className="bg-violet-500/10 border-b border-violet-500/20 py-2 text-center animate-in slide-in-from-top-1 duration-200">
          <span className="text-violet-300 text-xs font-medium">
            🫂 Você está vendo o planejamento orçamentário do casal ({user.name} & {partnerName})
          </span>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12 space-y-8 animate-in fade-in duration-300">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-zinc-800/80 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Planejamento Orçamentário</h1>
            <p className="text-zinc-400 text-sm mt-1">Planeje e acompanhe seus limites de gastos mensais</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Month Selector */}
            <div className="flex items-center bg-bg-surface border border-border-subtle rounded-xl p-1 shrink-0">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-bg-elevated rounded-lg text-zinc-400 hover:text-white transition-all"
                title="Mês Anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-semibold capitalize min-w-[125px] text-center text-text-primary px-2">
                {formatMonthLabel(currentMonth)}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-bg-elevated rounded-lg text-zinc-400 hover:text-white transition-all"
                title="Próximo Mês"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={handleCopy}
              disabled={isCopying}
              className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 border border-zinc-700/50 font-medium text-sm rounded-xl px-4 py-2.5 transition-all flex items-center gap-2"
              title="Copiar orçamentos do mês anterior"
            >
              <Copy className="w-4 h-4" />
              <span>{isCopying ? 'Copiando...' : 'Copiar Anterior'}</span>
            </button>

            <button
              onClick={() => setIsNewBudgetModalOpen(true)}
              className="bg-brand hover:bg-brand-hover text-white font-medium text-sm rounded-xl px-4 py-2.5 shadow-lg shadow-brand/20 transition-all flex items-center gap-2"
              title="Definir novo limite planejado"
            >
              <Plus className="w-4 h-4" />
              <span>Novo orçamento</span>
            </button>
          </div>
        </div>

        {/* Highlighted Summary / Totals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="auth-card p-6 flex items-start gap-4">
            <div className="p-3 bg-violet-500/10 text-violet-400 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Total Planejado</h3>
              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalPlanned)}</p>
            </div>
          </div>

          <div className="auth-card p-6 flex items-start gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Total Realizado</h3>
              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalRealized)}</p>
            </div>
          </div>

          <div className="auth-card p-6 flex items-start gap-4">
            <div className={`p-3 rounded-xl ${totalRemaining >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
              <PiggyBank className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Saldo Restante</h3>
              <p className={`text-2xl font-bold mt-1 ${totalRemaining >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCurrency(totalRemaining)}
              </p>
            </div>
          </div>

          <div className="auth-card p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Utilização Geral</h3>
              <span className={cn(
                "text-xs font-bold px-2 py-0.5 rounded-full select-none",
                totalPlanned > 0 && (totalRealized / totalPlanned >= 1) 
                  ? "bg-danger/10 text-danger border border-danger/20" 
                  : (totalPlanned > 0 && totalRealized / totalPlanned >= 0.8) 
                    ? "bg-warning/10 text-warning border border-warning/20" 
                    : "bg-success/10 text-success border border-success/20"
              )}>
                {totalPlanned > 0 ? `${Math.round((totalRealized / totalPlanned) * 100)}%` : '0%'}
              </span>
            </div>
            <div className="mt-3.5 w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  totalPlanned > 0 && (totalRealized / totalPlanned >= 1) 
                    ? "bg-danger" 
                    : (totalPlanned > 0 && totalRealized / totalPlanned >= 0.8) 
                      ? "bg-warning" 
                      : "bg-brand"
                )}
                style={{ width: `${Math.min(totalPlanned > 0 ? (totalRealized / totalPlanned) * 100 : 0, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Budget list */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 max-w-lg mx-auto text-center space-y-4">
            <AlertTriangle className="w-12 h-12 mx-auto" />
            <h3 className="font-bold text-lg">Erro ao carregar orçamento</h3>
            <p className="text-sm text-red-400/80">{error.message}</p>
          </div>
        ) : rootCategories.length === 0 ? (
          <div className="auth-card p-8">
            <EmptyState
              icon={<AlertTriangle className="w-8 h-8 text-warning" />}
              title="Nenhum orçamento planejado"
              description="Você ainda não definiu limites de orçamentos para este mês. Comece copiando o planejamento do mês anterior ou crie limites planejados para suas categorias."
              action={
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCopy}
                    disabled={isCopying}
                    className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 border border-zinc-700/50 font-medium text-sm rounded-xl px-4 py-2 transition-all flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{isCopying ? 'Copiando...' : 'Copiar Anterior'}</span>
                  </button>
                  <button
                    onClick={() => setIsNewBudgetModalOpen(true)}
                    className="bg-brand hover:bg-brand-hover text-white font-medium text-sm rounded-xl px-4 py-2 shadow-lg shadow-brand/20 transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Novo orçamento</span>
                  </button>
                </div>
              }
            />
          </div>
        ) : (
          <div className="auth-card overflow-hidden border border-border-subtle shadow-2xl">
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes rowFadeIn {
                from {
                  opacity: 0;
                  transform: translateY(-8px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              .subcategory-animate {
                animation: rowFadeIn 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
              }
            ` }} />
            <div className="px-6 py-5 border-b border-zinc-850 bg-bg-surface/40 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Distribuição por Categorias</h2>
                <p className="text-zinc-400 text-xs mt-0.5">Defina e gerencie limites de gastos mensais.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/30 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Categoria</th>
                    <th className="px-6 py-4 w-[180px] min-w-[180px]">Orçado</th>
                    <th className="px-6 py-4 w-[140px] min-w-[140px]">Gasto</th>
                    <th className="px-6 py-4 w-[140px] min-w-[140px]">Restante</th>
                    <th className="px-6 py-4">Progresso</th>
                    {isCouple && <th className="px-6 py-4">Membro</th>}
                  </tr>
                </thead>
                <tbody>
                  {rootCategories.map(rootCat => {
                    const children = subCategories.filter(sub => sub.parentCategoryId === rootCat.categoryId);
                    const isRootEditing = editingCategoryId === rootCat.categoryId;
                    const isCollapsed = !!collapsedCategories[rootCat.categoryId];
                    const isRootEditable = !isCouple || rootCat.userId === user.id || !rootCat.userId;
                    const rootRemaining = rootCat.plannedAmount - rootCat.realizedAmount;
                    const hasChildren = children.length > 0;

                    return (
                      <React.Fragment key={rootCat.categoryId}>
                        {/* Parent Category Row */}
                        <tr className={cn(
                          "hover:bg-bg-elevated/20 transition-colors bg-bg-surface/30 border-b border-zinc-800/40",
                          hasChildren && !isCollapsed && "border-b-0 bg-bg-surface/20"
                        )}>
                          {/* Categoria */}
                          <td className="px-6 py-4 font-semibold text-zinc-100 text-sm">
                            <div className="flex items-center gap-2">
                              {children.length > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => toggleCategory(rootCat.categoryId)}
                                  className="p-1 hover:bg-bg-elevated rounded text-zinc-400 hover:text-white transition-all flex items-center justify-center shrink-0"
                                >
                                  <ChevronRight className={cn(
                                    "w-4 h-4 transition-transform duration-200",
                                    !isCollapsed && "transform rotate-90"
                                  )} />
                                </button>
                              ) : (
                                <div className="w-6 h-6 shrink-0" />
                              )}
                              <span>{rootCat.categoryName}</span>
                            </div>
                          </td>

                          {/* Orçado */}
                          <td className="px-6 py-4 w-[180px]">
                            {isRootEditing ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  value={editValue}
                                  onChange={e => setEditValue(e.target.value)}
                                  className="w-24 bg-zinc-950 border border-zinc-800 focus:border-brand outline-none rounded-lg px-2.5 py-1 text-sm font-medium"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleSave(rootCat.categoryId)}
                                  className="p-1 hover:bg-success/10 text-success rounded-lg transition-all"
                                  title="Salvar"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setEditingCategoryId(null)}
                                  className="p-1 hover:bg-danger/10 text-zinc-400 hover:text-danger rounded-lg transition-all"
                                  title="Cancelar"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-zinc-100">{formatCurrency(rootCat.plannedAmount)}</span>
                                {isRootEditable ? (
                                  <button
                                    onClick={() => startEditing(rootCat.categoryId, rootCat.plannedAmount)}
                                    className="p-1 text-zinc-400 hover:text-brand rounded-lg transition-all"
                                    title="Editar limite planejado"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <span title={`Categoria de ${partnerName}`}>
                                    <Lock className="w-3.5 h-3.5 text-zinc-500 cursor-help inline-block" />
                                  </span>
                                )}
                              </div>
                            )}
                            {isRootEditing && saveError && (
                              <div className="text-[10px] text-danger mt-1">{saveError}</div>
                            )}
                          </td>

                          {/* Gasto */}
                          <td className="px-6 py-4 font-semibold text-zinc-300 w-[140px]">
                            {formatCurrency(rootCat.realizedAmount)}
                          </td>

                          {/* Restante */}
                          <td className="px-6 py-4 w-[140px]">
                            <span className={cn("font-medium tabular-nums text-sm", rootRemaining < 0 ? "text-danger font-semibold" : "text-zinc-400")}>
                              {formatCurrency(rootRemaining)}
                            </span>
                          </td>

                          {/* Progresso */}
                          <td className="px-6 py-4">
                            <ProgressBar value={rootCat.realizedAmount} max={rootCat.plannedAmount} className="w-56" />
                          </td>

                          {/* Membro* */}
                          {isCouple && (
                            <td className="px-6 py-4">
                              {rootCat.userId ? (
                                <div className="flex items-center gap-2">
                                  <div className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] uppercase border select-none shrink-0",
                                    rootCat.userId === user.id 
                                      ? "bg-brand/10 border-brand/30 text-brand" 
                                      : "bg-pink-500/10 border-pink-500/30 text-pink-400"
                                  )}>
                                    {rootCat.userId === user.id ? (user.name?.charAt(0) || 'U') : (partnerName.charAt(0) || 'P')}
                                  </div>
                                  <span className="text-xs font-medium text-zinc-300 truncate max-w-[80px]">
                                    {rootCat.userId === user.id ? 'Você' : partnerName.split(' ')[0]}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-zinc-500">—</span>
                              )}
                            </td>
                          )}
                        </tr>

                        {/* Child Subcategories Rows */}
                        {!isCollapsed && children.map((subCat, index) => {
                          const isSubEditing = editingCategoryId === subCat.categoryId;
                          const isSubEditable = !isCouple || subCat.userId === user.id || !subCat.userId;
                          const subRemaining = subCat.plannedAmount - subCat.realizedAmount;
                          const isLastChild = index === children.length - 1;

                          return (
                            <tr 
                              key={subCat.categoryId} 
                              className={cn(
                                "hover:bg-bg-elevated/10 transition-colors subcategory-animate",
                                isLastChild ? "border-b border-zinc-800/40" : "border-b-0"
                              )}
                            >
                              {/* Categoria */}
                              <td className="px-6 py-3 pl-12 text-sm font-normal text-zinc-400">
                                <div className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-700/40 shrink-0"></span>
                                  <span>{subCat.categoryName}</span>
                                </div>
                              </td>

                              {/* Orçado */}
                              <td className="px-6 py-3 text-sm w-[180px]">
                                {isSubEditing ? (
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="number"
                                      value={editValue}
                                      onChange={e => setEditValue(e.target.value)}
                                      className="w-24 bg-zinc-950 border border-zinc-800 focus:border-brand outline-none rounded-lg px-2.5 py-1 text-sm font-medium"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => handleSave(subCat.categoryId)}
                                      className="p-1 hover:bg-success/10 text-success rounded-lg transition-all"
                                      title="Salvar"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setEditingCategoryId(null)}
                                      className="p-1 hover:bg-danger/10 text-zinc-400 hover:text-danger rounded-lg transition-all"
                                      title="Cancelar"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-zinc-300">{formatCurrency(subCat.plannedAmount)}</span>
                                    {isSubEditable ? (
                                      <button
                                        onClick={() => startEditing(subCat.categoryId, subCat.plannedAmount)}
                                        className="p-1 text-zinc-400 hover:text-brand rounded-lg transition-all"
                                        title="Editar limite planejado"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                    ) : (
                                      <span title={`Categoria de ${partnerName}`}>
                                        <Lock className="w-3 h-3 text-zinc-500 cursor-help inline-block" />
                                      </span>
                                    )}
                                  </div>
                                )}
                                {isSubEditing && saveError && (
                                  <div className="text-[10px] text-danger mt-1">{saveError}</div>
                                )}
                              </td>

                              {/* Gasto */}
                              <td className="px-6 py-3 text-sm text-zinc-400 w-[140px]">
                                {formatCurrency(subCat.realizedAmount)}
                              </td>

                              {/* Restante */}
                              <td className="px-6 py-3 text-sm w-[140px]">
                                <span className={cn("font-medium tabular-nums text-sm", subRemaining < 0 ? "text-danger font-semibold" : "text-zinc-400")}>
                                  {formatCurrency(subRemaining)}
                                </span>
                              </td>

                              {/* Progresso */}
                              <td className="px-6 py-3">
                                <ProgressBar value={subCat.realizedAmount} max={subCat.plannedAmount} className="w-56" />
                              </td>

                              {/* Membro* */}
                              {isCouple && (
                                <td className="px-6 py-3 text-sm">
                                  {subCat.userId ? (
                                    <div className="flex items-center gap-2">
                                      <div className={cn(
                                        "w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] uppercase border select-none shrink-0",
                                        subCat.userId === user.id 
                                          ? "bg-brand/10 border-brand/30 text-brand" 
                                          : "bg-pink-500/10 border-pink-500/30 text-pink-400"
                                      )}>
                                        {subCat.userId === user.id ? (user.name?.charAt(0) || 'U') : (partnerName.charAt(0) || 'P')}
                                      </div>
                                      <span className="text-xs font-medium text-zinc-300 truncate max-w-[80px]">
                                        {subCat.userId === user.id ? 'Você' : partnerName.split(' ')[0]}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-zinc-500">—</span>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* New Budget Modal */}
      {isNewBudgetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="auth-card w-full max-w-md p-6 space-y-6 animate-in fade-in zoom-in-95 duration-150 text-white">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Tag className="w-5 h-5 text-brand" />
                <span>Novo Orçamento</span>
              </h2>
              <button 
                onClick={() => {
                  setIsNewBudgetModalOpen(false);
                  setNewBudgetError(null);
                }} 
                className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleNewBudgetSave} className="space-y-4">
              {newBudgetError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{newBudgetError}</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                  Categoria
                </label>
                <select
                  value={newBudgetCategoryId}
                  onChange={e => setNewBudgetCategoryId(e.target.value)}
                  className="w-full rounded-xl bg-zinc-800/50 border border-zinc-700/50 px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-brand focus:ring-brand/20 transition-all"
                >
                  <option value="">Selecione uma categoria...</option>
                  {getSortedCategoryOptions().map(opt => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                type="number"
                step="0.01"
                label="Valor Planejado (R$)"
                placeholder="0,00"
                value={newBudgetAmount}
                onChange={e => setNewBudgetAmount(e.target.value)}
              />

              <div className="flex justify-end gap-3 border-t border-zinc-800 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewBudgetModalOpen(false);
                    setNewBudgetError(null);
                  }}
                  className="px-4 py-2 text-sm font-semibold hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-brand hover:bg-brand-hover text-white rounded-xl shadow-lg shadow-brand/25 transition-all"
                >
                  Salvar Orçamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

