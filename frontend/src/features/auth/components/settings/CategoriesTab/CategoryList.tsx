import { useState } from 'react';
import { FolderPlus, Edit3, Trash2, Tag } from 'lucide-react';
import { cn } from '../../../../../lib/cn';
import { CATEGORY_COLORS, CATEGORY_ICONS } from './CategoryModal';
import type { Category } from '../../../../transactions/types';

interface CategoryListProps {
  categories: Category[];
  onAddSubcategory: (parentId: string) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  getCategoryMeta: (catId: string, catName: string) => { icon: string; color: string };
}

export function CategoryList({
  categories,
  onAddSubcategory,
  onEditCategory,
  onDeleteCategory,
  getCategoryMeta,
}: CategoryListProps) {
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});

  const toggleParentExpand = (id: string) => {
    setExpandedParents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getIconComponent = (iconName: string) => {
    const found = CATEGORY_ICONS.find((item) => item.name === iconName);
    return found ? found.icon : Tag;
  };

  const getColorClasses = (colorName: string) => {
    const found = CATEGORY_COLORS.find((item) => item.name === colorName);
    return found ? found.classes : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
  };

  const rootCategoriesAll = categories.filter((c) => !c.parentId);
  const getSubcategoriesAll = (parentId: string) => categories.filter((c) => c.parentId === parentId);

  return (
    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
      {rootCategoriesAll.map((parent) => {
        const subcats = getSubcategoriesAll(parent.id);
        const isExpanded = !!expandedParents[parent.id];
        const meta = getCategoryMeta(parent.id, parent.name);
        const IconComponent = getIconComponent(meta.icon);

        return (
          <div
            key={parent.id}
            className="border border-border-subtle rounded-xl bg-bg-surface/50 overflow-hidden hover:border-brand/30 hover:bg-bg-surface/75 transition-all duration-300"
          >
            <div className="flex items-center justify-between p-4 hover:bg-bg-elevated/20 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    'p-2 rounded-lg border flex items-center justify-center shrink-0',
                    getColorClasses(meta.color)
                  )}
                >
                  <IconComponent className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-text-primary text-sm tracking-tight truncate">
                    {parent.name}
                  </span>
                  {!parent.userId && (
                    <span className="text-[9px] font-semibold bg-bg-elevated text-text-secondary border border-border-subtle px-1.5 py-0.5 rounded select-none">
                      padrão
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-4">
                <button
                  onClick={() => onAddSubcategory(parent.id)}
                  title="Adicionar Subcategoria"
                  className="p-1.5 hover:text-text-primary text-text-muted hover:bg-bg-elevated rounded-lg transition-all cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleParentExpand(parent.id)}
                  className={cn(
                    'p-1.5 rounded-lg transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer',
                    isExpanded
                      ? 'text-brand bg-brand/10'
                      : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
                  )}
                >
                  <span>{subcats.length} sub</span>
                </button>

                <button
                  onClick={() => onEditCategory(parent)}
                  title="Editar"
                  className="p-1.5 hover:text-text-primary text-text-muted hover:bg-bg-elevated rounded-lg transition-all cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                {parent.userId && (
                  <button
                    onClick={() => onDeleteCategory(parent.id)}
                    title="Excluir"
                    className="p-1.5 hover:text-danger text-text-muted hover:bg-danger/10 rounded-lg transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {isExpanded && (
              <div className="ml-9 pl-4 border-l border-border-subtle pb-3 pt-2 space-y-1.5 pr-4 bg-bg-base/30">
                {subcats.map((sub) => {
                  const subMeta = getCategoryMeta(sub.id, sub.name);
                  const SubIcon = getIconComponent(subMeta.icon);

                  return (
                    <div
                      key={sub.id}
                      className="relative flex items-center justify-between text-xs py-2.5 pl-4 pr-3 hover:bg-bg-elevated/40 rounded-lg group/sub text-text-secondary hover:text-text-primary transition-colors"
                    >
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 border-t border-border-subtle/50"></div>

                      <div className="flex items-center gap-2.5 min-w-0 pl-1">
                        <div
                          className={cn(
                            'p-1 rounded border flex items-center justify-center shrink-0 bg-bg-surface border-border-subtle',
                            getColorClasses(subMeta.color)
                          )}
                        >
                          <SubIcon className="w-3.5 h-3.5 opacity-85" />
                        </div>
                        <span className="truncate font-medium text-text-secondary group-hover/sub:text-text-primary transition-colors">
                          {sub.name}
                        </span>
                        {!sub.userId && (
                          <span className="text-[8px] text-text-muted bg-bg-surface px-1.5 py-0.5 rounded border border-border-subtle select-none">
                            padrão
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover/sub:opacity-100 transition-all duration-200 shrink-0">
                        <button
                          onClick={() => onEditCategory(sub)}
                          title="Editar Subcategoria"
                          className="p-1 hover:text-text-primary text-text-muted hover:bg-bg-elevated rounded transition-all cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {sub.userId && (
                          <button
                            onClick={() => onDeleteCategory(sub.id)}
                            title="Excluir Subcategoria"
                            className="p-1 hover:text-danger text-text-muted hover:bg-danger/10 rounded transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {subcats.length === 0 && (
                  <div className="text-text-muted text-xs italic py-2 pl-4">
                    Sem subcategorias vinculadas
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
