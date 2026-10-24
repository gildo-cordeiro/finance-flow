import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlert, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { applyFieldErrors, nativeSelectClass } from '@/lib/forms';
import { errorMessage } from '@/services/errors';
import { usePaymentAccounts } from '../hooks/useCards';
import { useSaveCard } from '../hooks/useCardMutations';
import { cardDefaults, cardSchema, toCardRequest, type CardForm as CardFormValues } from '../schemas/cardSchemas';
import type { Card } from '../types';

interface CardFormProps {
  card?: Card;
  onDone: () => void;
}

export function CardForm({ card, onDone }: CardFormProps) {
  const save = useSaveCard();
  const accounts = usePaymentAccounts();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<CardFormValues>({ resolver: zodResolver(cardSchema), defaultValues: cardDefaults(card) });
  const { isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      await save.mutateAsync({ id: card?.id, data: toCardRequest(values) });
      toast.success(card ? 'Cartão atualizado.' : 'Cartão criado.');
      onDone();
    } catch (err) {
      const marked = applyFieldErrors(err, form.setError, {
        name: 'name',
        brand: 'brand',
        creditLimit: 'creditLimit',
        closingDay: 'closingDay',
        dueDay: 'dueDay',
        competenceOffset: 'competenceOffset',
        defaultPaymentAccountId: 'defaultPaymentAccountId',
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
                <Input placeholder="Ex.: Nubank" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="brand"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bandeira (opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ex.: Visa" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="creditLimit"
          render={({ field, fieldState }) => (
            <CurrencyInput label="Limite" value={field.value} onChange={field.onChange} error={fieldState.error?.message} />
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="closingDay"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dia de fechamento</FormLabel>
                <FormControl>
                  <Input type="number" min={1} max={31} inputMode="numeric" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dueDay"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dia de vencimento</FormLabel>
                <FormControl>
                  <Input type="number" min={1} max={31} inputMode="numeric" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <p className="text-xs text-text-label">
          O fechamento decide em qual fatura cada compra cai.
          {card && ' Um dia novo vale a partir da próxima fatura; as faturas já criadas mantêm as datas delas.'}
        </p>
        <FormField
          control={form.control}
          name="competenceOffset"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Competência da fatura (meses antes do vencimento)</FormLabel>
              <FormControl>
                <Input type="number" min={0} max={12} inputMode="numeric" {...field} />
              </FormControl>
              <FormDescription>
                Padrão 1: a fatura que vence em novembro é paga com a renda de outubro e entra no orçamento de outubro.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="defaultPaymentAccountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conta que costuma pagar (opcional)</FormLabel>
              <FormControl>
                <select className={nativeSelectClass} {...field}>
                  <option value="">Nenhuma</option>
                  {accounts.data?.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormDescription>Só sugere a conta ao pagar a fatura; você pode trocar na hora.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting && <LoaderCircle className="animate-spin" />}
            {card ? 'Salvar alterações' : 'Salvar cartão'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
