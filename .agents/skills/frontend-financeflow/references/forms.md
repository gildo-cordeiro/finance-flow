# Formulários com React Hook Form + Zod

> Referência da skill `frontend-financeflow`. Leia só quando a tarefa envolver este assunto. Regras gerais e convenções confirmadas: `../SKILL.md`.

## 3. Formulários com React Hook Form + Zod

Sempre use **React Hook Form + Zod** para formulários. Nunca `useState` para controlar campos.

```tsx
// features/transactions/components/CreateTransactionForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useCreateTransaction } from '../hooks/useCreateTransaction';

const schema = z.object({
  description: z.string().min(1, 'Descrição obrigatória').max(100),
  amount: z.coerce.number().positive('Valor deve ser positivo'),
  competenceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  type: z.enum(['EXPENSE', 'INCOME']),
});

type FormData = z.infer<typeof schema>;

export function CreateTransactionForm({ onSuccess }: { onSuccess: () => void }) {
  const { mutate, isPending } = useCreateTransaction();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormData) => {
    mutate(data, {
      onSuccess,
      onError: (err) => {
        // Mapeia erros de campo do backend para o formulário
        if (err.errors) {
          err.errors.forEach(({ field, message }) => {
            setError(field as keyof FormData, { message });
          });
        }
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Descrição"
        placeholder="Ex: Mercado, Salário..."
        error={errors.description?.message}
        {...register('description')}
      />
      <Input
        label="Valor (R$)"
        type="number"
        step="0.01"
        placeholder="0,00"
        error={errors.amount?.message}
        {...register('amount')}
      />
      <Input
        label="Data de Competência"
        type="date"
        error={errors.competenceDate?.message}
        {...register('competenceDate')}
      />
      <Button type="submit" loading={isPending} className="w-full">
        Salvar Transação
      </Button>
    </form>
  );
}
```
