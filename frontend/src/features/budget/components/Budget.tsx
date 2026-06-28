import React, { useState } from 'react';
import { useBudget } from '../hooks/useBudget';
import { useAuth } from '../../auth/hooks/useAuth';
import { 
  Calendar, ChevronLeft, ChevronRight, 
  Copy, Edit2, Check, X, AlertTriangle, 
  TrendingUp, PiggyBank, Wallet, Lock
} from 'lucide-react';
import { useView } from '../../../context/ViewContext';
import { useCouple } from '../../couple/hooks/useCouple';
import { cn } from '../../../lib/cn';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { MoneyValue } from '../../../components/ui/MoneyValue';

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
      currency: user.currency,
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

  // Separate parent and child categories for structured view
  const rootCategories = budget?.items.filter(item => !item.parentCategoryId) || [];
  const subCategories = budget?.items.filter(item => item.parentCategoryId) || [];

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
      <main className="max-w-6xl mx-auto px-4 py-12 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Planejamento Orçamentário</h1>
            <p className="text-zinc-400 text-sm mt-1">Planeje e acompanhe seus limites de gastos mensais</p>
          </div>
          <button
            onClick={handleCopy}
            disabled={isCopying}
            className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white font-medium text-sm rounded-xl px-4 py-2.5 border border-zinc-700/50 transition-all flex items-center gap-2 self-start sm:self-center"
          >
            <Copy className="w-4 h-4" />
            <span>{isCopying ? 'Copiando...' : 'Copiar Anterior'}</span>
          </button>
        </div>
        
        {/* Month Selector */}
        <div className="flex items-center justify-between glassmorphism p-4 rounded-2xl border border-zinc-800/50">
          <div className="flex items-center gap-3">
            <Calendar className="text-violet-400 w-5 h-5" />
            <span className="text-sm text-zinc-400 font-medium">Período de Planejamento</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-zinc-800/50 rounded-lg text-zinc-400 hover:text-white transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-lg font-semibold capitalize min-w-[150px] text-center">
              {formatMonthLabel(currentMonth)}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-zinc-800/50 rounded-lg text-zinc-400 hover:text-white transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Totals Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        ) : (
          <div className="auth-card overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-800/80 flex items-center justify-between">
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
                    <th className="px-6 py-4">Planejado</th>
                    <th className="px-6 py-4">Realizado</th>
                    <th className="px-6 py-4">Status / Progresso</th>
                    <th className="px-6 py-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {rootCategories.map(rootCat => {
                    const children = subCategories.filter(sub => sub.parentCategoryId === rootCat.categoryId);
                    const isRootEditing = editingCategoryId === rootCat.categoryId;

                    return (
                      <React.Fragment key={rootCat.categoryId}>
                        {/* Parent Category Row */}
                        <tr className="hover:bg-zinc-900/10 transition-colors bg-zinc-900/5">
                          <td className="px-6 py-4 font-semibold text-zinc-200 flex items-center gap-2">
                            <span>{rootCat.categoryName}</span>
                            {isCouple && rootCat.userId && (
                              <span className={cn(
                                "text-[9px] font-bold px-1.5 py-0.5 rounded border select-none font-sans",
                                rootCat.userId === user.id 
                                  ? "bg-violet-500/10 border-violet-500/20 text-violet-300"
                                  : "bg-pink-500/10 border-pink-500/20 text-pink-300"
                              )}>
                                {rootCat.userId === user.id ? 'Você' : partnerName}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {isRootEditing ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  value={editValue}
                                  onChange={e => setEditValue(e.target.value)}
                                  className="w-24 bg-zinc-950 border border-zinc-800 focus:border-violet-500 outline-none rounded-lg px-2.5 py-1 text-sm font-medium"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleSave(rootCat.categoryId)}
                                  className="p-1 hover:bg-emerald-500/10 text-emerald-400 rounded-lg transition-all"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setEditingCategoryId(null)}
                                  className="p-1 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 rounded-lg transition-all"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <span className="font-medium text-text-primary"><MoneyValue amount={rootCat.plannedAmount} showSign={false} className="font-medium text-text-primary" /></span>
                            )}
                            {isRootEditing && saveError && (
                              <div className="text-[10px] text-red-400 mt-1">{saveError}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 font-medium text-text-secondary">
                            <MoneyValue amount={rootCat.realizedAmount} showSign={false} className="font-medium text-text-secondary" />
                          </td>
                          <td className="px-6 py-4">
                            <ProgressBar value={rootCat.realizedAmount} max={rootCat.plannedAmount} className="w-40" />
                          </td>
                          <td className="px-6 py-4 text-right">
                            {!isRootEditing && (
                              (!isCouple || rootCat.userId === user.id || !rootCat.userId) ? (
                                <button
                                  onClick={() => startEditing(rootCat.categoryId, rootCat.plannedAmount)}
                                  className="p-1.5 text-zinc-400 hover:text-violet-400 hover:bg-violet-500/5 rounded-lg transition-all"
                                  title="Editar limite planejado"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              ) : (
                                <span title={`Categoria de ${partnerName}`}>
                                  <Lock className="w-4 h-4 text-zinc-500 cursor-help inline-block" />
                                </span>
                              )
                            )}
                          </td>
                        </tr>

                        {/* Child Subcategories Rows */}
                        {children.map(subCat => {
                          const isSubEditing = editingCategoryId === subCat.categoryId;

                          return (
                            <tr key={subCat.categoryId} className="hover:bg-zinc-900/10 transition-colors">
                              <td className="px-6 py-3 text-sm text-zinc-400 pl-12 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700"></span>
                                <span>{subCat.categoryName}</span>
                                {isCouple && subCat.userId && (
                                  <span className={cn(
                                    "text-[9px] font-bold px-1.5 py-0.5 rounded border select-none font-sans",
                                    subCat.userId === user.id 
                                      ? "bg-violet-500/10 border-violet-500/20 text-violet-300"
                                      : "bg-pink-500/10 border-pink-500/20 text-pink-300"
                                  )}>
                                    {subCat.userId === user.id ? 'Você' : partnerName}
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-3 text-sm">
                                {isSubEditing ? (
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="number"
                                      value={editValue}
                                      onChange={e => setEditValue(e.target.value)}
                                      className="w-24 bg-zinc-950 border border-zinc-800 focus:border-violet-500 outline-none rounded-lg px-2.5 py-1 text-sm font-medium"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => handleSave(subCat.categoryId)}
                                      className="p-1 hover:bg-emerald-500/10 text-emerald-400 rounded-lg transition-all"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setEditingCategoryId(null)}
                                      className="p-1 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 rounded-lg transition-all"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-text-secondary"><MoneyValue amount={subCat.plannedAmount} showSign={false} className="text-text-secondary" /></span>
                                )}
                                {isSubEditing && saveError && (
                                  <div className="text-[10px] text-red-400 mt-1">{saveError}</div>
                                )}
                              </td>
                              <td className="px-6 py-3 text-sm text-text-secondary">
                                <MoneyValue amount={subCat.realizedAmount} showSign={false} className="text-text-secondary font-normal" />
                              </td>
                              <td className="px-6 py-3">
                                <ProgressBar value={subCat.realizedAmount} max={subCat.plannedAmount} className="w-40" />
                              </td>
                              <td className="px-6 py-3 text-right">
                                {!isSubEditing && (
                                  (!isCouple || subCat.userId === user.id || !subCat.userId) ? (
                                    <button
                                      onClick={() => startEditing(subCat.categoryId, subCat.plannedAmount)}
                                      className="p-1.5 text-zinc-500 hover:text-violet-400 hover:bg-violet-500/5 rounded-lg transition-all"
                                      title="Editar limite planejado"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <span title={`Categoria de ${partnerName}`}>
                                      <Lock className="w-3.5 h-3.5 text-zinc-500 cursor-help inline-block" />
                                    </span>
                                  )
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                  {rootCategories.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-zinc-500 text-sm">
                        Nenhuma categoria encontrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
