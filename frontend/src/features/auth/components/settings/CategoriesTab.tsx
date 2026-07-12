import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCategories } from '../../../transactions/hooks/useCategories';
import { useToast } from '../../../../context/ToastContext';
import type { Category } from '../../../transactions/types';
import {
  Tag,
  FolderPlus,
  Edit3,
  Trash2,
  Plus,
  Heart,
  Loader2,
  Info,
  X,
  Check,
  TrendingUp,
  Coffee,
  Home,
  Car,
  Smile,
  Activity,
  BookOpen,
  ShoppingBag,
  Gift,
  Wallet,
  AlertTriangle
} from 'lucide-react';
import { Input } from '../../../../components/ui/Input';
import { Button } from '../../../../components/ui/Button';
import { cn } from '../../../../lib/cn';

const CATEGORY_ICONS = [
  { name: 'TrendingUp', icon: TrendingUp },
  { name: 'Coffee', icon: Coffee },
  { name: 'Home', icon: Home },
  { name: 'Car', icon: Car },
  { name: 'Smile', icon: Smile },
  { name: 'Heart', icon: Heart },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Tag', icon: Tag },
  { name: 'ShoppingBag', icon: ShoppingBag },
  { name: 'Gift', icon: Gift },
  { name: 'Wallet', icon: Wallet },
  { name: 'Activity', icon: Activity }
] as const;

const CATEGORY_COLORS = [
  { name: 'emerald', hex: '#10b981', classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { name: 'blue', hex: '#3b82f6', classes: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { name: 'indigo', hex: '#6366f1', classes: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  { name: 'violet', hex: '#8b5cf6', classes: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  { name: 'pink', hex: '#ec4899', classes: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
  { name: 'amber', hex: '#f59e0b', classes: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { name: 'red', hex: '#ef4444', classes: 'bg-red-500/10 text-red-400 border-red-500/20' },
  { name: 'zinc', hex: '#71717a', classes: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' }
] as const;

export function CategoriesTab() {
  const { categories, createCategory, updateCategory, deleteCategory, isLoading: isCategoriesLoading } = useCategories();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catModalMode, setCatModalMode] = useState<'create' | 'edit'>('create');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form States
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('Tag');
  const [categoryColor, setCategoryColor] = useState('zinc');
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  const getCategoryMeta = (catId: string, catName: string) => {
    const stored = localStorage.getItem(`cat_meta_${catId}`);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        localStorage.removeItem(`cat_meta_${catId}`);
      }
    }

    const nameLower = catName.toLowerCase();
    if (nameLower.includes('receita') || nameLower.includes('salário') || nameLower.includes('salario') || nameLower.includes('invest')) {
      return { icon: 'TrendingUp', color: 'emerald' };
    }
    if (nameLower.includes('aliment') || nameLower.includes('supermercado') || nameLower.includes('restaurante') || nameLower.includes('comer') || nameLower.includes('padaria')) {
      return { icon: 'Coffee', color: 'amber' };
    }
    if (nameLower.includes('mora') || nameLower.includes('aluguel') || nameLower.includes('luz') || nameLower.includes('net') || nameLower.includes('casa') || nameLower.includes('condominio')) {
      return { icon: 'Home', color: 'blue' };
    }
    if (nameLower.includes('transp') || nameLower.includes('car') || nameLower.includes('uber') || nameLower.includes('combustivel') || nameLower.includes('oficina')) {
      return { icon: 'Car', color: 'indigo' };
    }
    if (nameLower.includes('lazer') || nameLower.includes('viagem') || nameLower.includes('cinema') || nameLower.includes('show') || nameLower.includes('festa')) {
      return { icon: 'Smile', color: 'pink' };
    }
    if (nameLower.includes('saúde') || nameLower.includes('saude') || nameLower.includes('medico') || nameLower.includes('remedio') || nameLower.includes('farmacia') || nameLower.includes('dentista')) {
      return { icon: 'Heart', color: 'red' };
    }
    if (nameLower.includes('edu') || nameLower.includes('curso') || nameLower.includes('facul') || nameLower.includes('livro') || nameLower.includes('escola')) {
      return { icon: 'BookOpen', color: 'violet' };
    }

    return { icon: 'Tag', color: 'zinc' };
  };

  const getIconComponent = (iconName: string) => {
    const found = CATEGORY_ICONS.find(item => item.name === iconName);
    return found ? found.icon : Tag;
  };

  const getColorClasses = (colorName: string) => {
    const found = CATEGORY_COLORS.find(item => item.name === colorName);
    return found ? found.classes : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
  };

  const toggleParentExpand = (id: string) => {
    setExpandedParents(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenNewCat = (parentId: string | null = null) => {
    setCatModalMode('create');
    setSelectedParentId(parentId);
    setCategoryName('');
    setCategoryIcon('Tag');
    setCategoryColor('zinc');
    setCategoryError(null);
    setIsCatModalOpen(true);
  };

  const handleOpenEditCat = (cat: Category) => {
    setCatModalMode('edit');
    setEditingCategory(cat);
    setCategoryName(cat.name);
    
    const meta = getCategoryMeta(cat.id, cat.name);
    setCategoryIcon(meta.icon);
    setCategoryColor(meta.color);
    
    setCategoryError(null);
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      toast.error('O nome da categoria não pode estar em branco.');
      setCategoryError('O nome da categoria não pode estar em branco.');
      return;
    }

    setIsSavingCategory(true);
    setCategoryError(null);

    try {
      if (catModalMode === 'create') {
        const payload = {
          name: categoryName.trim(),
          parentId: selectedParentId
        };
        const newCat = await createCategory(payload);
        
        localStorage.setItem(
          `cat_meta_${newCat.id}`,
          JSON.stringify({ icon: categoryIcon, color: categoryColor })
        );
        toast.success('Categoria criada com sucesso!');
      } else {
        if (!editingCategory) return;

        if (editingCategory.userId) {
          const payload = {
            name: categoryName.trim(),
            parentId: editingCategory.parentId || null
          };
          const updatedCat = await updateCategory(editingCategory.id, payload);
          
          localStorage.setItem(
            `cat_meta_${updatedCat.id}`,
            JSON.stringify({ icon: categoryIcon, color: categoryColor })
          );
        } else {
          // Standard Category (no userId): only save metadata in localStorage
          localStorage.setItem(
            `cat_meta_${editingCategory.id}`,
            JSON.stringify({ icon: categoryIcon, color: categoryColor })
          );
          queryClient.invalidateQueries({ queryKey: ['categories'] });
        }
        toast.success('Categoria atualizada com sucesso!');
      }

      setIsCatModalOpen(false);
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || 'Erro ao salvar categoria.');
      setCategoryError(error.message || 'Erro ao salvar categoria.');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta categoria? Todas as subcategorias associadas também podem ser afetadas.')) {
      return;
    }
    try {
      await deleteCategory(id);
      localStorage.removeItem(`cat_meta_${id}`);
      toast.success('Categoria excluída com sucesso!');
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || 'Falha ao excluir categoria.');
    }
  };

  const rootCategoriesAll = categories.filter(c => !c.parentId);
  const getSubcategoriesAll = (parentId: string) => categories.filter(c => c.parentId === parentId);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-3 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Estrutura de Categorias</h2>
          <p className="text-zinc-400 text-sm mt-1">Crie e edite suas categorias e subcategorias de receitas e despesas</p>
        </div>
        <Button
          onClick={() => handleOpenNewCat(null)}
          className="sm:w-auto text-xs py-2 px-4 flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nova Categoria Pai
        </Button>
      </div>

      {isCategoriesLoading ? (
        <div className="auth-card p-12 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-3" />
          <p className="text-zinc-400 text-sm">Carregando categorias...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="auth-card p-12 text-center">
          <Tag className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="font-bold text-zinc-300">Nenhuma categoria cadastrada</h3>
          <p className="text-zinc-500 text-sm mt-1">Crie sua primeira categoria para começar a organizar seus lançamentos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 auth-card p-6 space-y-4">
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
              {rootCategoriesAll.map(parent => {
                const subcats = getSubcategoriesAll(parent.id);
                const isExpanded = !!expandedParents[parent.id];
                const meta = getCategoryMeta(parent.id, parent.name);
                const IconComponent = getIconComponent(meta.icon);

                return (
                  <div key={parent.id} className="border border-border-subtle rounded-xl bg-bg-surface/50 overflow-hidden hover:border-brand/30 hover:bg-bg-surface/75 transition-all duration-300">
                    <div className="flex items-center justify-between p-4 hover:bg-bg-elevated/20 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn("p-2 rounded-lg border flex items-center justify-center shrink-0", getColorClasses(meta.color))}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold text-text-primary text-sm tracking-tight truncate">{parent.name}</span>
                          {!parent.userId && (
                            <span className="text-[9px] font-semibold bg-bg-elevated text-text-secondary border border-border-subtle px-1.5 py-0.5 rounded select-none">
                              padrão
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-4">
                        <button
                          onClick={() => handleOpenNewCat(parent.id)}
                          title="Adicionar Subcategoria"
                          className="p-1.5 hover:text-text-primary text-text-muted hover:bg-bg-elevated rounded-lg transition-all"
                        >
                          <FolderPlus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleParentExpand(parent.id)}
                          className={cn(
                            "p-1.5 rounded-lg transition-all text-xs font-semibold flex items-center gap-1.5",
                            isExpanded ? "text-brand bg-brand/10" : "text-text-muted hover:text-text-primary hover:bg-bg-elevated"
                          )}
                        >
                          <span>{subcats.length} sub</span>
                        </button>
                        
                        <button
                          onClick={() => handleOpenEditCat(parent)}
                          title="Editar"
                          className="p-1.5 hover:text-text-primary text-text-muted hover:bg-bg-elevated rounded-lg transition-all"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {parent.userId && (
                          <button
                            onClick={() => handleDeleteCategory(parent.id)}
                            title="Excluir"
                            className="p-1.5 hover:text-danger text-text-muted hover:bg-danger/10 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="ml-9 pl-4 border-l border-border-subtle pb-3 pt-2 space-y-1.5 pr-4 bg-bg-base/30">
                        {subcats.map(sub => {
                          const subMeta = getCategoryMeta(sub.id, sub.name);
                          const SubIcon = getIconComponent(subMeta.icon);

                          return (
                            <div key={sub.id} className="relative flex items-center justify-between text-xs py-2.5 pl-4 pr-3 hover:bg-bg-elevated/40 rounded-lg group/sub text-text-secondary hover:text-text-primary transition-colors">
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 border-t border-border-subtle/50"></div>
                              
                              <div className="flex items-center gap-2.5 min-w-0 pl-1">
                                <div className={cn("p-1 rounded border flex items-center justify-center shrink-0 bg-bg-surface border-border-subtle", getColorClasses(subMeta.color))}>
                                  <SubIcon className="w-3.5 h-3.5 opacity-85" />
                                </div>
                                <span className="truncate font-medium text-text-secondary group-hover/sub:text-text-primary transition-colors">{sub.name}</span>
                                {!sub.userId && (
                                  <span className="text-[8px] text-text-muted bg-bg-surface px-1.5 py-0.5 rounded border border-border-subtle select-none">padrão</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover/sub:opacity-100 transition-all duration-200 shrink-0">
                                <button
                                  onClick={() => handleOpenEditCat(sub)}
                                  title="Editar Subcategoria"
                                  className="p-1 hover:text-text-primary text-text-muted hover:bg-bg-elevated rounded transition-all"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                {sub.userId && (
                                  <button
                                    onClick={() => handleDeleteCategory(sub.id)}
                                    title="Excluir Subcategoria"
                                    className="p-1 hover:text-danger text-text-muted hover:bg-danger/10 rounded transition-all"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {subcats.length === 0 && (
                          <div className="text-text-muted text-xs italic py-2 pl-4">Sem subcategorias vinculadas</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="auth-card p-6 space-y-6 self-start">
            <h3 className="text-lg font-bold flex items-center gap-2 text-text-primary">
              <Info className="w-5 h-5 text-blue-400" />
              <span>Boas Práticas</span>
            </h3>
            
            <div className="space-y-4 text-xs text-text-secondary leading-relaxed">
              <p>
                As categorias ajudam a estruturar e controlar os seus orçamentos do mês.
              </p>
              <div className="p-3.5 bg-bg-base border border-border-subtle rounded-xl space-y-2.5">
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 mt-1.5 bg-text-muted rounded-full shrink-0"></span>
                  <div>
                    <strong>Categorias padrão:</strong> Não podem ser excluídas ou ter seus nomes alterados, mas suas cores e ícones podem ser personalizados livremente.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 mt-1.5 bg-brand rounded-full shrink-0"></span>
                  <div>
                    <strong>Categorias personalizadas:</strong> Podem ter seus nomes alterados, subcategorias criadas, ou serem excluídas.
                  </div>
                </div>
              </div>
              <p>
                Procure registrar suas transações sempre nas **subcategorias** (ex: Alimentação &gt; Supermercado) para ter relatórios e gráficos mais precisos.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY EDIT/CREATE MODAL */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-bg-surface border border-border-subtle w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 space-y-5">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h3 className="text-lg font-bold text-white">
                {catModalMode === 'create'
                  ? selectedParentId ? 'Nova Subcategoria' : 'Nova Categoria Pai'
                  : !editingCategory?.userId
                    ? 'Editar Aparência (Categoria Padrão)'
                    : 'Editar Categoria'
                }
              </h3>
              <button
                onClick={() => setIsCatModalOpen(false)}
                className="p-1 hover:bg-bg-elevated rounded-lg text-text-muted hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!editingCategory?.userId && catModalMode === 'edit' && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs rounded-xl flex items-start gap-2.5">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Esta é uma categoria padrão do sistema. Você pode alterar seu ícone e cor, mas seu nome não pode ser modificado.</span>
              </div>
            )}

            {categoryError && (
              <div className="p-3 bg-danger/10 border border-danger/20 text-danger text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>{categoryError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <Input
                type="text"
                label="Nome da Categoria"
                placeholder="Ex: Streaming, Padaria..."
                required
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                disabled={catModalMode === 'edit' && !editingCategory?.userId}
                hint={catModalMode === 'edit' && !editingCategory?.userId ? "Nome fixado para relatórios nativos." : undefined}
              />

              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block">Ícone Visual</label>
                <div className="grid grid-cols-6 gap-2 p-3 bg-bg-base/40 border border-border-subtle rounded-xl max-h-[140px] overflow-y-auto pr-1 scrollbar-thin">
                  {CATEGORY_ICONS.map(item => {
                    const IconComp = item.icon;
                    const isSelected = categoryIcon === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setCategoryIcon(item.name)}
                        className={cn(
                          "p-2 rounded-lg border flex items-center justify-center transition-all hover:bg-bg-elevated hover:text-text-primary",
                          isSelected
                            ? "border-brand bg-brand/10 text-brand"
                            : "border-transparent text-text-muted"
                        )}
                      >
                        <IconComp className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block">Cor da Categoria</label>
                <div className="flex flex-wrap gap-2.5 p-3 bg-bg-base/40 border border-border-subtle rounded-xl">
                  {CATEGORY_COLORS.map(color => {
                    const isSelected = categoryColor === color.name;
                    return (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setCategoryColor(color.name)}
                        className="w-7 h-7 rounded-full flex items-center justify-center transition-all border border-zinc-900 shadow hover:scale-110 active:scale-95"
                        style={{ backgroundColor: color.hex }}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-zinc-950 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="bg-transparent hover:bg-bg-elevated text-text-secondary hover:text-text-primary font-medium rounded-xl py-2 px-4 transition-all text-sm"
                >
                  Cancelar
                </button>
                <Button type="submit" loading={isSavingCategory}>
                  Salvar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
