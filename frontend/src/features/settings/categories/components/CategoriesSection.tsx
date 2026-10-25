import { useState } from 'react';
import { CircleAlert, Plus, Tags } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArchivedToggle } from '@/components/ui/ArchivedToggle';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/services/errors';
import { useCategories } from '../hooks/useCategories';
import { CATEGORY_TYPE_LABELS, type Category, type CategoryType } from '../types';
import { CategoryNameForm } from './CategoryNameForm';
import { CategoryRow, type CategoryAction } from './CategoryRow';
import { MergeCategoryForm } from './MergeCategoryForm';

type Panel = { action: 'create' } | { action: CategoryAction; category: Category } | null;

const TITLES: Record<CategoryAction | 'create', string> = {
  create: 'Nova categoria',
  addSubcategory: 'Nova subcategoria',
  rename: 'Renomear categoria',
  merge: 'Mesclar categoria',
};

export function CategoriesSection() {
  const [type, setType] = useState<CategoryType>('EXPENSE');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const categories = useCategories(type, includeArchived);
  const close = () => setPanel(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="group" aria-label="Tipo de categoria" className="inline-grid grid-cols-2 rounded-lg border border-border-subtle bg-bg-base p-0.5">
          {(['EXPENSE', 'INCOME'] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={type === option}
              onClick={() => setType(option)}
              className={cn(
                'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                type === option ? 'bg-bg-elevated font-semibold text-text-primary' : 'text-text-label hover:text-text-primary'
              )}
            >
              {CATEGORY_TYPE_LABELS[option]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <ArchivedToggle
            id="show-archived-categories"
            label="Mostrar arquivadas"
            checked={includeArchived}
            onCheckedChange={setIncludeArchived}
          />
          <Button variant="outline" onClick={() => setPanel({ action: 'create' })}>
            <Plus />
            Nova categoria
          </Button>
        </div>
      </div>

      {categories.isPending && (
        <div role="status" aria-label="Carregando categorias" className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      )}
      {categories.isError && (
        <Alert variant="destructive">
          <CircleAlert className="h-4 w-4" />
          <AlertDescription>{errorMessage(categories.error)}</AlertDescription>
        </Alert>
      )}
      {categories.data?.length === 0 && (
        <EmptyState compact icon={<Tags className="h-6 w-6" />} title="Nenhuma categoria" />
      )}
      {categories.data && categories.data.length > 0 && (
        <ul aria-label={`Categorias de ${CATEGORY_TYPE_LABELS[type].toLowerCase()}`} className="divide-y divide-border-subtle">
          {categories.data.map((category) => (
            <li key={category.id}>
              <CategoryRow category={category} onAction={(action, target) => setPanel({ action, category: target })} />
              {category.subcategories.map((sub) => (
                <CategoryRow key={sub.id} category={sub} onAction={(action, target) => setPanel({ action, category: target })} />
              ))}
            </li>
          ))}
        </ul>
      )}

      <Sheet open={panel !== null} onOpenChange={(open) => !open && close()}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md" aria-describedby={undefined}>
          <SheetHeader className="mb-6">
            <SheetTitle>{panel && TITLES[panel.action]}</SheetTitle>
          </SheetHeader>
          {panel?.action === 'create' && <CategoryNameForm mode="create" type={type} onDone={close} />}
          {panel?.action === 'addSubcategory' && (
            <CategoryNameForm mode="create" type={type} parent={panel.category} onDone={close} />
          )}
          {panel?.action === 'rename' && <CategoryNameForm mode="rename" category={panel.category} onDone={close} />}
          {panel?.action === 'merge' && (
            <MergeCategoryForm source={panel.category} tree={categories.data ?? []} onDone={close} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
