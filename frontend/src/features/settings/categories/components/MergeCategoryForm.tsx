import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlert, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { applyFieldErrors, nativeSelectClass } from '@/lib/forms';
import { errorMessage } from '@/services/errors';
import { useCategoryMutations } from '../hooks/useCategoryMutations';
import { mergeCategorySchema, type MergeCategoryForm as MergeCategoryValues } from '../schemas/categorySchema';
import type { Category } from '../types';

interface MergeCategoryFormProps {
  source: Category;
  /** Árvore ativa do mesmo tipo da origem. */
  tree: Category[];
  onDone: () => void;
}

export function MergeCategoryForm({ source, tree, onDone }: MergeCategoryFormProps) {
  const { merge } = useCategoryMutations();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<MergeCategoryValues>({ resolver: zodResolver(mergeCategorySchema), defaultValues: { targetId: '' } });
  const { isSubmitting } = form.formState;
  const targets = tree
    .flatMap((root) => [
      { id: root.id, label: root.name, archived: root.archived },
      ...root.subcategories.map((sub) => ({ id: sub.id, label: `${root.name} › ${sub.name}`, archived: sub.archived })),
    ])
    .filter((target) => target.id !== source.id && !target.archived);

  const onSubmit = form.handleSubmit(async ({ targetId }) => {
    setError(null);
    try {
      await merge.mutateAsync({ id: source.id, targetId });
      toast.success(`“${source.name}” mesclada.`);
      onDone();
    } catch (err) {
      const marked = applyFieldErrors(err, form.setError, { targetId: 'targetId' });
      setError(marked ? null : errorMessage(err));
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <CircleAlert className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <FormField
          control={form.control}
          name="targetId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mesclar em</FormLabel>
              <FormControl>
                <select className={nativeSelectClass} {...field}>
                  <option value="">Escolha a categoria</option>
                  {targets.map(({ id, label }) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormDescription>
                As transações e os orçamentos de “{source.name}” passam para a categoria escolhida, e “{source.name}” é
                arquivada.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting && <LoaderCircle className="animate-spin" />}
            Mesclar
          </Button>
        </div>
      </form>
    </Form>
  );
}
