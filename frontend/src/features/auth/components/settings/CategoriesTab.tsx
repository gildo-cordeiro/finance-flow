import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCategories } from '../../../transactions/hooks/useCategories';
import { useToast } from '../../../../context/ToastContext';
import type { Category } from '../../../transactions/types';
import { Tag, Plus, Loader2, Info } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { CategoryList } from './CategoriesTab/CategoryList';
import { CategoryModal } from './CategoriesTab/CategoryModal';

export function CategoriesTab() {
  const {
    categories,
    createCategory,
    updateCategory,
    deleteCategory,
    isLoading: isCategoriesLoading,
  } = useCategories();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catModalMode, setCatModalMode] = useState<'create' | 'edit'>('create');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
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
    if (
      nameLower.includes('receita') ||
      nameLower.includes('salário') ||
      nameLower.includes('salario') ||
      nameLower.includes('invest')
    ) {
      return { icon: 'TrendingUp', color: 'emerald' };
    }
    if (
      nameLower.includes('aliment') ||
      nameLower.includes('supermercado') ||
      nameLower.includes('restaurante') ||
      nameLower.includes('comer') ||
      nameLower.includes('padaria')
    ) {
      return { icon: 'Coffee', color: 'amber' };
    }
    if (
      nameLower.includes('mora') ||
      nameLower.includes('aluguel') ||
      nameLower.includes('luz') ||
      nameLower.includes('net') ||
      nameLower.includes('casa') ||
      nameLower.includes('condominio')
    ) {
      return { icon: 'Home', color: 'blue' };
    }
    if (
      nameLower.includes('transp') ||
      nameLower.includes('car') ||
      nameLower.includes('uber') ||
      nameLower.includes('combustivel') ||
      nameLower.includes('oficina')
    ) {
      return { icon: 'Car', color: 'indigo' };
    }
    if (
      nameLower.includes('lazer') ||
      nameLower.includes('viagem') ||
      nameLower.includes('cinema') ||
      nameLower.includes('show') ||
      nameLower.includes('festa')
    ) {
      return { icon: 'Smile', color: 'pink' };
    }
    if (
      nameLower.includes('saúde') ||
      nameLower.includes('saude') ||
      nameLower.includes('medico') ||
      nameLower.includes('remedio') ||
      nameLower.includes('farmacia') ||
      nameLower.includes('dentista')
    ) {
      return { icon: 'Heart', color: 'red' };
    }
    if (
      nameLower.includes('edu') ||
      nameLower.includes('curso') ||
      nameLower.includes('facul') ||
      nameLower.includes('livro') ||
      nameLower.includes('escola')
    ) {
      return { icon: 'BookOpen', color: 'violet' };
    }

    return { icon: 'Tag', color: 'zinc' };
  };

  const handleOpenNewCat = (parentId: string | null = null) => {
    setCatModalMode('create');
    setSelectedParentId(parentId);
    setCategoryError(null);
    setIsCatModalOpen(true);
  };

  const handleOpenEditCat = (cat: Category) => {
    setCatModalMode('edit');
    setEditingCategory(cat);
    setCategoryError(null);
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = async (name: string, icon: string, color: string) => {
    if (!name.trim()) {
      toast.error('O nome da categoria não pode estar em branco.');
      setCategoryError('O nome da categoria não pode estar em branco.');
      return;
    }

    setIsSavingCategory(true);
    setCategoryError(null);

    try {
      if (catModalMode === 'create') {
        const payload = {
          name: name.trim(),
          parentId: selectedParentId,
        };
        const newCat = await createCategory(payload);

        localStorage.setItem(`cat_meta_${newCat.id}`, JSON.stringify({ icon, color }));
        toast.success('Categoria criada com sucesso!');
      } else {
        if (!editingCategory) return;

        if (editingCategory.userId) {
          const payload = {
            name: name.trim(),
            parentId: editingCategory.parentId || null,
          };
          const updatedCat = await updateCategory(editingCategory.id, payload);

          localStorage.setItem(`cat_meta_${updatedCat.id}`, JSON.stringify({ icon, color }));
        } else {
          // Standard Category (no userId): only save metadata in localStorage
          localStorage.setItem(`cat_meta_${editingCategory.id}`, JSON.stringify({ icon, color }));
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
    if (
      !window.confirm(
        'Tem certeza que deseja excluir esta categoria? Todas as subcategorias associadas também podem ser afetadas.'
      )
    ) {
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

  const getInitialMeta = () => {
    if (catModalMode === 'edit' && editingCategory) {
      return getCategoryMeta(editingCategory.id, editingCategory.name);
    }
    return { icon: 'Tag', color: 'zinc' };
  };

  const initialMeta = getInitialMeta();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-3 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Estrutura de Categorias</h2>
          <p className="text-zinc-400 text-sm mt-1">
            Crie e edite suas categorias e subcategorias de receitas e despesas
          </p>
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
          <p className="text-zinc-500 text-sm mt-1">
            Crie sua primeira categoria para começar a organizar seus lançamentos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 auth-card p-6 space-y-4">
            <CategoryList
              categories={categories}
              onAddSubcategory={handleOpenNewCat}
              onEditCategory={handleOpenEditCat}
              onDeleteCategory={handleDeleteCategory}
              getCategoryMeta={getCategoryMeta}
            />
          </div>

          <div className="auth-card p-6 space-y-6 self-start">
            <h3 className="text-lg font-bold flex items-center gap-2 text-text-primary">
              <Info className="w-5 h-5 text-blue-400" />
              <span>Boas Práticas</span>
            </h3>

            <div className="space-y-4 text-xs text-text-secondary leading-relaxed">
              <p>As categorias ajudam a estruturar e controlar os seus orçamentos do mês.</p>
              <div className="p-3.5 bg-bg-base border border-border-subtle rounded-xl space-y-2.5">
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 mt-1.5 bg-text-muted rounded-full shrink-0"></span>
                  <div>
                    <strong>Categorias padrão:</strong> Não podem ser excluídas ou ter seus nomes
                    alterados, mas suas cores e ícones podem ser personalizados livremente.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 mt-1.5 bg-brand rounded-full shrink-0"></span>
                  <div>
                    <strong>Categorias personalizadas:</strong> Podem ter seus nomes alterados,
                    subcategorias criadas, ou serem excluídas.
                  </div>
                </div>
              </div>
              <p>
                Procure registrar suas transações sempre nas **subcategorias** (ex: Alimentação &gt;
                Supermercado) para ter relatórios e gráficos mais precisos.
              </p>
            </div>
          </div>
        </div>
      )}

      <CategoryModal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        mode={catModalMode}
        selectedParentId={selectedParentId}
        editingCategory={editingCategory}
        onSave={handleSaveCategory}
        isSaving={isSavingCategory}
        error={categoryError}
        initialIcon={initialMeta.icon}
        initialColor={initialMeta.color}
      />
    </div>
  );
}
