import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CircleAlert, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/Skeleton';
import { applyFieldErrors, nativeSelectClass } from '@/lib/forms';
import { errorMessage } from '@/services/errors';
import { usePaymentAccounts } from '../hooks/useCards';
import { usePayInvoice } from '../hooks/useCardMutations';
import { paymentSchema, toPayInvoiceRequest, type PaymentForm as PaymentFormValues } from '../schemas/cardSchemas';
import type { PaymentAccountOption } from '../types';

interface PaymentFormProps {
  invoiceId: string;
  openAmount: number;
  defaultAccountId: string | null;
  onDone: () => void;
}

// A conta sugerida depende da lista de contas, então o formulário só nasce depois dela
export function PaymentForm(props: PaymentFormProps) {
  const accounts = usePaymentAccounts();
  if (!accounts.data) {
    return (
      <div role="status" aria-label="Carregando contas">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  return <PaymentFields {...props} accounts={accounts.data} />;
}

function PaymentFields({
  invoiceId,
  openAmount,
  defaultAccountId,
  onDone,
  accounts,
}: PaymentFormProps & { accounts: PaymentAccountOption[] }) {
  const pay = usePayInvoice();
  const [error, setError] = useState<string | null>(null);
  // ADR-0009: a conta pagadora do cartão é só sugestão; arquivada, não aparece na lista
  const suggested = accounts.some((account) => account.id === defaultAccountId) ? defaultAccountId : null;
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema(openAmount)),
    defaultValues: {
      fromAccountId: suggested ?? '',
      amount: openAmount,
      paymentDate: format(new Date(), 'yyyy-MM-dd'),
    },
  });
  const { isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      await pay.mutateAsync({ invoiceId, data: toPayInvoiceRequest(values) });
      toast.success(values.amount < openAmount ? 'Pagamento parcial registrado.' : 'Fatura paga.');
      onDone();
    } catch (err) {
      const marked = applyFieldErrors(err, form.setError, {
        fromAccountId: 'fromAccountId',
        amount: 'amount',
        paymentDate: 'paymentDate',
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
          name="fromAccountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conta pagadora</FormLabel>
              <FormControl>
                <select className={nativeSelectClass} {...field}>
                  <option value="">Escolha</option>
                  {accounts.map((account) => (
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
          name="amount"
          render={({ field, fieldState }) => (
            <CurrencyInput label="Valor" value={field.value} onChange={field.onChange} error={fieldState.error?.message} />
          )}
        />
        <FormField
          control={form.control}
          name="paymentDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data do pagamento</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormDescription>Um valor menor que o saldo deixa a fatura paga em parte.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting && <LoaderCircle className="animate-spin" />}
            Confirmar pagamento
          </Button>
        </div>
      </form>
    </Form>
  );
}
