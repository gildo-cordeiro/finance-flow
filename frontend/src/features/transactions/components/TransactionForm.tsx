import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CircleAlert, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import { applyFieldErrors, nativeSelectClass } from '@/lib/forms';
import { errorMessage } from '@/services/errors';
import { useSaveTransaction } from '../hooks/useTransactionMutations';
import { useAccountOptions, useCategoryOptions } from '../hooks/useTransactions';
import { formDefaults, toTransactionRequest, transactionSchema, type TransactionForm as FormValues } from '../schemas/transactionSchema';
import type { EntryType, Transaction } from '../types';
import { CompetenceField } from './CompetenceField';

const TYPES: { value: EntryType; label: string }[] = [
  { value: 'EXPENSE', label: 'Despesa' },
  { value: 'INCOME', label: 'Receita' },
];

interface TransactionFormProps {
  transaction?: Transaction;
  onDone: () => void;
}

export function TransactionForm({ transaction, onDone }: TransactionFormProps) {
  const save = useSaveTransaction();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: formDefaults(format(new Date(), 'yyyy-MM-dd'), transaction),
  });
  const [type, accountId, dueDate, paid] = useWatch({
    control: form.control,
    name: ['type', 'accountId', 'dueDate', 'paid'],
  });
  const accounts = useAccountOptions();
  const categories = useCategoryOptions(type);
  // Cartões entram pela fatura (F1-14)
  const bankAccounts = accounts.data?.filter((account) => account.type !== 'CREDIT_CARD') ?? [];
  const { isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      await save.mutateAsync({ id: transaction?.id, data: toTransactionRequest(values) });
      toast.success(transaction ? 'Transação atualizada.' : 'Transação criada.');
      onDone();
    } catch (err) {
      const marked = applyFieldErrors(err, form.setError, {
        description: 'description',
        amount: 'amount',
        accountId: 'accountId',
        categoryId: 'categoryId',
        dueDate: 'dueDate',
        paymentDate: 'paymentDate',
        competenceMonth: 'competenceMonth',
      });
      setError(marked ? null : errorMessage(err));
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {error && (
          <Alert variant="destructive">
            <CircleAlert className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div role="group" aria-label="Tipo" className="grid grid-cols-2 gap-1 rounded-lg border border-border-subtle bg-bg-base p-1">
          {TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={type === value}
              onClick={() => {
                form.setValue('type', value);
                form.setValue('categoryId', '');
              }}
              className={cn(
                'rounded-md py-2 text-sm font-medium text-text-label transition-colors',
                type === value && (value === 'EXPENSE' ? 'bg-danger/15 text-text-primary' : 'bg-success/15 text-text-primary')
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <FormField
          control={form.control}
          name="amount"
          render={({ field, fieldState }) => (
            <CurrencyInput value={field.value} onChange={field.onChange} error={fieldState.error?.message} autoFocus={!transaction} />
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input placeholder="Ex.: Aluguel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="accountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Conta</FormLabel>
                <FormControl>
                  <select className={nativeSelectClass} {...field}>
                    <option value="">Escolha</option>
                    {bankAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
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
        </div>
        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{type === 'INCOME' ? 'Recebimento previsto' : 'Vencimento'}</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-3 rounded-lg border border-border-subtle bg-bg-elevated p-4">
          <FormField
            control={form.control}
            name="paid"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
                </FormControl>
                <FormLabel>{type === 'INCOME' ? 'Já foi recebido' : 'Já foi pago'}</FormLabel>
              </FormItem>
            )}
          />
          {paid ? (
            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de pagamento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <FormField
              control={form.control}
              name="planned"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
                  </FormControl>
                  <FormLabel>Ainda é uma previsão</FormLabel>
                </FormItem>
              )}
            />
          )}
        </div>
        <FormField
          control={form.control}
          name="competenceMonth"
          render={({ field, fieldState }) => (
            <CompetenceField
              accountId={accountId}
              referenceDate={dueDate}
              value={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting && <LoaderCircle className="animate-spin" />}
            {transaction ? 'Salvar alterações' : 'Salvar transação'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

