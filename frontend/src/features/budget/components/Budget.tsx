import React, { useState } from 'react';
import { useBudget } from '../hooks/useBudget';
import { useAuth } from '../../auth/hooks/useAuth';
import { useToast } from '../../../context/ToastContext';
import { Copy, Plus, AlertTriangle } from 'lucide-react';
import { useView } from '../../../context/ViewContext';
import { useCouple } from '../../couple/hooks/useCouple';
import { EmptyState } from '../../../components/ui/EmptyState';
import { BudgetSummary } from './BudgetSummary';
import { BudgetRow } from './BudgetRow';
import { BudgetModal } from './BudgetModal';
import { PageContainer } from '../../../components/ui/PageContainer';
import { PageHeader } from '../../../components/ui/PageHeader';
import { PeriodSelector } from '../../../components/ui/PeriodSelector';

export function Budget() {
  const { user } = useAuth();
  const { viewContext } = useView();
  const toast = useToast();
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
    budget,
    isLoading,
    error,
    updatePlannedAmount,
    copyPreviousBudget,
    isCopying,
  } = useBudget(currentMonth);

  // Inline editing state
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  // Collapsed categories state
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // New budget modal state
  const [isNewBudgetModalOpen, setIsNewBudgetModalOpen] = useState(false);

  if (!user) return null;

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

  const handleSave = async (categoryId: string, value: number) => {
    setSaveError(null);
    if (isNaN(value) || value < 0) {
      setSaveError('Valor inválido');
      toast.error('Valor inválido.');
      return;
    }

    try {
      await updatePlannedAmount(categoryId, value);
      setEditingCategoryId(null);
      toast.success('Orçamento atualizado!');
    } catch {
      setSaveError('Erro ao salvar');
      toast.error('Erro ao salvar orçamento.');
      throw new Error('Erro ao salvar orçamento');
    }
  };

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // Totals calculations
  const totalPlanned = budget?.items.reduce((sum, item) => sum + item.plannedAmount, 0) || 0;
  const totalRealized = budget?.items.reduce((sum, item) => sum + item.realizedAmount, 0) || 0;
  const totalRemaining = totalPlanned - totalRealized;

  const handleCopy = async () => {
    if (
      window.confirm(
        'Deseja copiar o planejamento do mês anterior para este mês? Os valores existentes serão mesclados.'
      )
    ) {
      try {
        await copyPreviousBudget();
        toast.success('Planejamento do mês anterior copiado!');
      } catch {
        toast.error('Erro ao copiar orçamento anterior.');
      }
    }
  };

  const handleNewBudgetSave = async (categoryId: string, amount: number) => {
    try {
      await updatePlannedAmount(categoryId, amount);
      toast.success('Orçamento salvo com sucesso!');
    } catch {
      toast.error('Erro ao salvar orçamento.');
      throw new Error('Erro ao salvar orçamento');
    }
  };

  // Separate parent and child categories for structured view
  const rootCategories = budget?.items.filter((item) => !item.parentCategoryId) || [];
  const subCategories = budget?.items.filter((item) => item.parentCategoryId) || [];

  // Dropdown options helper for hierarchy select
  const getSortedCategoryOptions = () => {
    if (!budget) return [];
    const roots = budget.items.filter((item) => !item.parentCategoryId);
    const children = budget.items.filter((item) => item.parentCategoryId);

    const options: { id: string; name: string }[] = [];
    roots.forEach((root) => {
      options.push({ id: root.categoryId, name: root.categoryName });
      const subCats = children.filter((child) => child.parentCategoryId === root.categoryId);
      subCats.forEach((sub) => {
        options.push({ id: sub.categoryId, name: `  └─ ${sub.categoryName}` });
      });
    });
    return options;
  };

  return (
    <>
      {/* Couple context banner — visible only in COUPLE mode */}
      {isCouple && (
        <div className="bg-violet-500/10 border-b border-violet-500/20 py-2 text-center animate-in slide-in-from-top-1 duration-200">
          <span className="text-violet-300 text-xs font-medium">
            🫂 Você está vendo o planejamento orçamentário do casal ({user.name} & {partnerName})
          </span>
        </div>
      )}

      <PageContainer>
        <PageHeader
          title="Planejamento Orçamentário"
          subtitle="Planeje e acompanhe seus limites de gastos mensais"
          actions={
            <>
              {/* Month Selector */}
            <PeriodSelector
              value={currentMonth}
              onChange={(val) => {
                setCurrentMonth(val);
                setEditingCategoryId(null);
              }}
            />

            <button
              onClick={handleCopy}
              disabled={isCopying}
              className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 border border-zinc-700/50 font-medium text-sm rounded-xl px-4 py-2.5 transition-all flex items-center gap-2 cursor-pointer"
              title="Copiar orçamentos do mês anterior"
            >
              <Copy className="w-4 h-4" />
              <span>{isCopying ? 'Copiando...' : 'Copiar Anterior'}</span>
            </button>

            <button
              onClick={() => setIsNewBudgetModalOpen(true)}
              className="bg-brand hover:bg-brand-hover text-white font-medium text-sm rounded-xl px-4 py-2.5 shadow-lg shadow-brand/20 transition-all flex items-center gap-2 cursor-pointer"
              title="Definir novo limite planejado"
            >
              <Plus className="w-4 h-4" />
              <span>Novo orçamento</span>
            </button>
          </>
        }
      />

        {/* Highlighted Summary / Totals Grid */}
        <BudgetSummary
          totalPlanned={totalPlanned}
          totalRealized={totalRealized}
          totalRemaining={totalRemaining}
          currency={user.currency}
        />

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
                    className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 border border-zinc-700/50 font-medium text-sm rounded-xl px-4 py-2 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{isCopying ? 'Copiando...' : 'Copiar Anterior'}</span>
                  </button>
                  <button
                    onClick={() => setIsNewBudgetModalOpen(true)}
                    className="bg-brand hover:bg-brand-hover text-white font-medium text-sm rounded-xl px-4 py-2 shadow-lg shadow-brand/20 transition-all flex items-center gap-2 cursor-pointer"
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
            <style
              dangerouslySetInnerHTML={{
                __html: `
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
            `,
              }}
            />
            <div className="px-6 py-5 border-b border-border-subtle bg-bg-surface/40 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Distribuição por Categorias</h2>
                <p className="text-zinc-400 text-xs mt-0.5">Defina e gerencie limites de gastos mensais.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/30 text-zinc-400 text-xs font-semibold uppercase tracking-wide">
                    <th className="px-6 py-4 text-left">Categoria</th>
                    <th className="px-6 py-4 w-[180px] min-w-[180px] text-right">Orçado</th>
                    <th className="px-6 py-4 w-[140px] min-w-[140px] text-right">Gasto</th>
                    <th className="px-6 py-4 w-[140px] min-w-[140px] text-right">Restante</th>
                    <th className="px-6 py-4 text-left">Progresso</th>
                    {isCouple && <th className="px-6 py-4 text-left">Membro</th>}
                  </tr>
                </thead>
                <tbody>
                  {rootCategories.map((rootCat) => {
                    const children = subCategories.filter(
                      (sub) => sub.parentCategoryId === rootCat.categoryId
                    );
                    const isRootEditing = editingCategoryId === rootCat.categoryId;
                    const isCollapsed = !!collapsedCategories[rootCat.categoryId];
                    const isRootEditable = !isCouple || rootCat.userId === user.id || !rootCat.userId;
                    const hasChildren = children.length > 0;

                    return (
                      <React.Fragment key={rootCat.categoryId}>
                        {/* Parent Category Row */}
                        <BudgetRow
                          categoryId={rootCat.categoryId}
                          categoryName={rootCat.categoryName}
                          plannedAmount={rootCat.plannedAmount}
                          realizedAmount={rootCat.realizedAmount}
                          userId={rootCat.userId}
                          parentCategoryId={null}
                          isEditing={isRootEditing}
                          isEditable={isRootEditable}
                          isCollapsed={isCollapsed}
                          hasChildren={hasChildren}
                          onToggleCollapse={() => toggleCategory(rootCat.categoryId)}
                          onStartEditing={() => startEditing(rootCat.categoryId, rootCat.plannedAmount)}
                          onSave={(val) => handleSave(rootCat.categoryId, val)}
                          onCancelEditing={() => setEditingCategoryId(null)}
                          editValue={editValue}
                          onEditValueChange={setEditValue}
                          saveError={saveError}
                          formatCurrency={formatCurrency}
                          isCouple={isCouple}
                          partnerName={partnerName}
                          user={user}
                        />

                        {/* Child Subcategories Rows */}
                        {!isCollapsed &&
                          children.map((subCat) => {
                            const isSubEditing = editingCategoryId === subCat.categoryId;
                            const isSubEditable =
                              !isCouple || subCat.userId === user.id || !subCat.userId;

                            return (
                              <BudgetRow
                                key={subCat.categoryId}
                                categoryId={subCat.categoryId}
                                categoryName={subCat.categoryName}
                                plannedAmount={subCat.plannedAmount}
                                realizedAmount={subCat.realizedAmount}
                                userId={subCat.userId}
                                parentCategoryId={rootCat.categoryId}
                                isEditing={isSubEditing}
                                isEditable={isSubEditable}
                                isCollapsed={false}
                                hasChildren={false}
                                onToggleCollapse={() => {}}
                                onStartEditing={() => startEditing(subCat.categoryId, subCat.plannedAmount)}
                                onSave={(val) => handleSave(subCat.categoryId, val)}
                                onCancelEditing={() => setEditingCategoryId(null)}
                                editValue={editValue}
                                onEditValueChange={setEditValue}
                                saveError={saveError}
                                formatCurrency={formatCurrency}
                                isCouple={isCouple}
                                partnerName={partnerName}
                                user={user}
                              />
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
      </PageContainer>

      {/* New Budget Modal */}
      <BudgetModal
        isOpen={isNewBudgetModalOpen}
        onClose={() => setIsNewBudgetModalOpen(false)}
        onSave={handleNewBudgetSave}
        categoryOptions={getSortedCategoryOptions()}
      />
    </>
  );
}
