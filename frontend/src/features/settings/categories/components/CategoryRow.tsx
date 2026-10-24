import { useState } from 'react';
import { Archive, ArchiveRestore, Merge, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/services/errors';
import { useCategoryMutations } from '../hooks/useCategoryMutations';
import type { Category } from '../types';

export type CategoryAction = 'addSubcategory' | 'rename' | 'merge';

interface CategoryRowProps {
  category: Category;
  onAction: (action: CategoryAction, category: Category) => void;
}

export function CategoryRow({ category, onAction }: CategoryRowProps) {
  const { setArchived, remove } = useCategoryMutations();
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
    <div className={cn('flex items-center justify-between gap-2 py-2', !isRoot && 'pl-6')}>
      <span className={cn('truncate', isRoot ? 'font-semibold text-text-primary' : 'text-text-label')}>
        {name}
        {category.archived && <span className="ml-2 text-xs font-normal text-text-muted">(arquivada)</span>}
      </span>
      <div className="flex shrink-0 items-center">
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
        <Button variant="ghost" size="icon" aria-label={`Mesclar ${name}`} onClick={() => onAction('merge', category)} disabled={busy}>
          <Merge />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`${category.archived ? 'Desarquivar' : 'Arquivar'} ${name}`}
          onClick={toggleArchived}
          disabled={busy}
        >
          {category.archived ? <ArchiveRestore /> : <Archive />}
        </Button>
        {confirmingDelete ? (
          <Button variant="destructive" size="sm" onClick={deleteCategory} disabled={busy}>
            Confirmar exclusão
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Excluir ${name}`}
            onClick={() => setConfirmingDelete(true)}
            disabled={busy}
          >
            <Trash2 />
          </Button>
        )}
      </div>
    </div>
  );
}
