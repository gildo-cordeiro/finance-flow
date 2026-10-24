import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CircleAlert, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { applyFieldErrors, nativeSelectClass } from '@/lib/forms';
import { errorMessage } from '@/services/errors';
import { formatDate, formatMonth } from '@/utils/formatters';
import { useExpenseCategories, useInvoicePreview } from '../hooks/useCards';
import { usePurchase } from '../hooks/useCardMutations';
import { purchaseSchema, toPurchaseRequest, type PurchaseForm as PurchaseFormValues } from '../schemas/cardSchemas';

interface PurchaseFormProps {
  cardId: string;
  onDone: () => void;
}

export function PurchaseForm({ cardId, onDone }: PurchaseFormProps) {
  const purchase = usePurchase();
  const categories = useExpenseCategories();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      amount: 0,
      description: '',
      categoryId: '',
      purchaseDate: format(new Date(), 'yyyy-MM-dd'),
      installments: '1',
    },
  });
  const { isSubmitting } = form.formState;
  const purchaseDate = useWatch({ control: form.control, name: 'purchaseDate' });
  const installments = Number(useWatch({ control: form.control, name: 'installments' }));
  const preview = useInvoicePreview(cardId, purchaseDate);

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      await purchase.mutateAsync({ cardId, data: toPurchaseRequest(values) });
      toast.success('Compra lançada.');
      onDone();
    } catch (err) {
      const marked = applyFieldErrors(err, form.setError, {
        amount: 'amount',
        description: 'description',
        categoryId: 'categoryId',
        purchaseDate: 'purchaseDate',
        installments: 'installments',
      });
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
          name="amount"
          render={({ field, fieldState }) => (
            <CurrencyInput
              label="Valor total"
              value={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message}
              autoFocus
            />
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input placeholder="Ex.: Supermercado" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <FormControl>
                <select className={nativeSelectClass} {...field}>
                  <option value="">Escolha</option>
                  {categories.data?.flatMap((category) => [
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>,
                    ...category.subcategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {`${category.name} › ${sub.name}`}
                      </option>
                    )),
                  ])}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="purchaseDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data da compra</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="installments"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parcelas</FormLabel>
                <FormControl>
                  <Input type="number" min={1} max={48} inputMode="numeric" {...field} />
                </FormControl>
                <FormDescription>Uma parcela por fatura.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {preview.data && (
          <p role="status" className="rounded-lg border border-brand/35 bg-brand/5 p-3 text-sm text-text-primary">
            {installments > 1 ? 'A primeira parcela entra' : 'Entra'} na fatura que vence em{' '}
            <strong>{formatDate(preview.data.dueDate)}</strong>, competência{' '}
            <strong>{formatMonth(`${preview.data.competenceMonth}-01`)}</strong>.
          </p>
        )}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting && <LoaderCircle className="animate-spin" />}
            Lançar compra
          </Button>
        </div>
      </form>
    </Form>
  );
}
