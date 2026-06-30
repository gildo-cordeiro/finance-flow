import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Landmark } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useAddContribution } from '../hooks/useGoals';
import { useToast } from '../../../context/ToastContext';

const contributionSchema = z.object({
  amount: z.coerce.number().positive('O valor deve ser maior que zero'),
  contributionDate: z.string().min(1, 'A data é obrigatória'),
  note: z.string().optional(),
});

type ContributionFormData = z.infer<typeof contributionSchema>;

interface AddContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalId: string;
}

export function AddContributionModal({ isOpen, onClose, goalId }: AddContributionModalProps) {
  const toast = useToast();
  const addContribution = useAddContribution(goalId);

  const getTodayStr = () => {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContributionFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(contributionSchema) as any,
    defaultValues: {
      amount: 0,
      contributionDate: getTodayStr(),
      note: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        amount: 0,
        contributionDate: getTodayStr(),
        note: '',
      });
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: ContributionFormData) => {
    try {
      await addContribution.mutateAsync(data);
      toast.success('Contribuição registrada com sucesso!');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao registrar contribuição.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Landmark className="w-4.5 h-4.5" />
            </div>
            <h2 className="text-base font-semibold text-text-primary">Registrar Contribuição</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-text-secondary hover:text-white rounded-lg hover:bg-bg-elevated transition-all"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <Input
            label="Valor da Contribuição (R$)"
            type="number"
            step="0.01"
            placeholder="0,00"
            error={errors.amount?.message}
            {...register('amount')}
          />

          <Input
            label="Data"
            type="date"
            error={errors.contributionDate?.message}
            {...register('contributionDate')}
          />

          <Input
            label="Observação (Opcional)"
            placeholder="Ex: Economia do mês, Renda extra..."
            error={errors.note?.message}
            {...register('note')}
          />

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={addContribution.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={addContribution.isPending}>
              Registrar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
