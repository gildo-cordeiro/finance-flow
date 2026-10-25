import { useState } from 'react';
import { Archive, ArchiveRestore, Merge, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { RowMenu } from '@/components/ui/RowMenu';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/services/errors';
import { useDeleteCategory, useSetCategoryArchived } from '../hooks/useCategoryMutations';
import type { Category } from '../types';

export type CategoryAction = 'addSubcategory' | 'rename' | 'merge';

interface CategoryRowProps {
  category: Category;
  onAction: (action: CategoryAction, category: Category) => void;
}

export function CategoryRow({ category, onAction }: CategoryRowProps) {
  const setArchived = useSetCategoryArchived();
  const remove = useDeleteCategory();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const isRoot = category.parentId === null;
  const busy = setArchived.isPending || remove.isPending;
  const { name } = category;

  const toggleArchived = async () => {
    try {
      await setArchived.mutateAsync({ id: category.id, archived: !category.archived });
      toast.success(category.archived ? 'Categoria desarquivada.' : 'Categoria arquivada.');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const deleteCategory = async () => {
    try {
      await remove.mutateAsync(category.id);
      toast.success('Categoria excluída.');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setConfirmingDelete(false);
    }
  };

  return (
    <div
      className={cn(
        '-mx-2 flex min-h-12 items-center justify-between gap-2 rounded-md px-2 py-1 transition-colors hover:bg-bg-elevated/40',
        !isRoot && 'pl-8'
      )}
    >
      <span className={cn('flex min-w-0 items-center gap-2', category.archived && 'opacity-70')}>
        <span className={cn('truncate', isRoot ? 'font-semibold text-text-primary' : 'text-text-label')}>{name}</span>
        {category.archived && (
          <span className="shrink-0 rounded-full border border-border-subtle px-2 text-xs text-text-label">Arquivada</span>
        )}
      </span>
      <div className="flex shrink-0 items-center">
        {confirmingDelete ? (
          <>
            <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button variant="destructive" size="sm" onClick={deleteCategory} disabled={busy}>
              Confirmar exclusão
            </Button>
          </>
        ) : (
          <>
            {isRoot && !category.archived && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Adicionar subcategoria em ${name}`}
                onClick={() => onAction('addSubcategory', category)}
                disabled={busy}
              >
                <Plus />
              </Button>
            )}
            <Button variant="ghost" size="icon" aria-label={`Renomear ${name}`} onClick={() => onAction('rename', category)} disabled={busy}>
              <Pencil />
            </Button>
            <RowMenu label={`Mais ações de ${name}`} disabled={busy}>
              <DropdownMenuItem onSelect={() => onAction('merge', category)}>
                <Merge />
                Mesclar em outra…
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={toggleArchived}>
                {category.archived ? <ArchiveRestore /> : <Archive />}
                {category.archived ? 'Desarquivar' : 'Arquivar'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-danger focus:text-danger" onSelect={() => setConfirmingDelete(true)}>
                <Trash2 />
                Excluir
              </DropdownMenuItem>
            </RowMenu>
          </>
        )}
      </div>
    </div>
  );
}
