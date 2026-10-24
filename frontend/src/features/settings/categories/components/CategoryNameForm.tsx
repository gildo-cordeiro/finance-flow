import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlert, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { applyFieldErrors } from '@/lib/forms';
import { errorMessage } from '@/services/errors';
import { useCategoryMutations } from '../hooks/useCategoryMutations';
import { categoryNameSchema, type CategoryNameForm as CategoryNameValues } from '../schemas/categorySchema';
import type { Category, CategoryType } from '../types';

type CategoryNameFormProps =
  | { mode: 'create'; type: CategoryType; parent?: Category; onDone: () => void }
  | { mode: 'rename'; category: Category; onDone: () => void };

/** Cria uma categoria (ou subcategoria de `parent`) ou renomeia uma existente. */
export function CategoryNameForm(props: CategoryNameFormProps) {
  const { create, rename } = useCategoryMutations();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<CategoryNameValues>({
    resolver: zodResolver(categoryNameSchema),
    defaultValues: { name: props.mode === 'rename' ? props.category.name : '' },
  });
  const { isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async ({ name }) => {
    setError(null);
    try {
      if (props.mode === 'rename') {
        await rename.mutateAsync({ id: props.category.id, name });
        toast.success('Categoria renomeada.');
      } else {
        await create.mutateAsync({ name, type: props.type, parentId: props.parent?.id ?? null });
        toast.success(props.parent ? 'Subcategoria criada.' : 'Categoria criada.');
      }
      props.onDone();
    } catch (err) {
      const marked = applyFieldErrors(err, form.setError, { name: 'name' });
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting && <LoaderCircle className="animate-spin" />}
            {props.mode === 'rename' ? 'Salvar' : 'Criar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
