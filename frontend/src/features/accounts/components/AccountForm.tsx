import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlert, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { applyFieldErrors, nativeSelectClass } from '@/lib/forms';
import { errorMessage } from '@/services/errors';
import { useSaveAccount } from '../hooks/useAccountMutations';
import { accountSchema, toAccountRequest, type AccountForm as AccountFormValues } from '../schemas/accountSchema';
import { ACCOUNT_TYPE_LABELS, type Account } from '../types';

function defaults(account?: Account): AccountFormValues {
  return {
    name: account?.name ?? '',
    type: account?.type === 'SAVINGS' ? 'SAVINGS' : 'CHECKING',
    bank: account?.bank ?? '',
    initialBalance: account ? account.initialBalance.toFixed(2).replace('.', ',') : '0,00',
    competenceOffset: String(account?.competenceOffset ?? 0),
  };
}

interface AccountFormProps {
  account?: Account;
  onDone: () => void;
}

export function AccountForm({ account, onDone }: AccountFormProps) {
  const save = useSaveAccount();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<AccountFormValues>({ resolver: zodResolver(accountSchema), defaultValues: defaults(account) });
  const { isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      await save.mutateAsync({ id: account?.id, data: toAccountRequest(values) });
      toast.success(account ? 'Conta atualizada.' : 'Conta criada.');
      onDone();
    } catch (err) {
      const marked = applyFieldErrors(err, form.setError, {
        name: 'name',
        type: 'type',
        bank: 'bank',
        initialBalance: 'initialBalance',
        competenceOffset: 'competenceOffset',
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Ex.: Conta do dia a dia" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <FormControl>
                <select className={nativeSelectClass} {...field}>
                  <option value="CHECKING">{ACCOUNT_TYPE_LABELS.CHECKING}</option>
                  <option value="SAVINGS">{ACCOUNT_TYPE_LABELS.SAVINGS}</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bank"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Banco (opcional)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="initialBalance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Saldo inicial (R$)</FormLabel>
              <FormControl>
                <Input inputMode="decimal" {...field} />
              </FormControl>
              <FormDescription>O saldo atual é calculado a partir dele e das transações pagas.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="competenceOffset"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deslocamento de competência (meses)</FormLabel>
              <FormControl>
                <Input type="number" min={0} max={12} inputMode="numeric" {...field} />
              </FormControl>
              <FormDescription>
                Quantos meses antes da data a competência sugerida cai. Para conta corrente e poupança, normalmente 0.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting && <LoaderCircle className="animate-spin" />}
            {account ? 'Salvar alterações' : 'Criar conta'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
