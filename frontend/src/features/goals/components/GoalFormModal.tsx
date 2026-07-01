import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Target } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { useCouple } from '../../couple/hooks/useCouple';
import { useCreateGoal, useUpdateGoal } from '../hooks/useGoals';
import { Goal } from '../types';
import { useToast } from '../../../context/ToastContext';

const goalSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório'),
  description: z.string().optional(),
  targetAmount: z.coerce.number().positive('O valor alvo deve ser maior que zero'),
  deadline: z.string().min(1, 'O prazo é obrigatório'),
  isShared: z.boolean().default(false),
  initialAmount: z.coerce.number().min(0, 'O valor inicial não pode ser negativo').optional(),
});

type GoalFormData = z.infer<typeof goalSchema>;

interface GoalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingGoal?: Goal | null;
}

export function GoalFormModal({ isOpen, onClose, editingGoal }: GoalFormModalProps) {
  const toast = useToast();
  const { coupleStatus } = useCouple();
  const isCoupleActive = coupleStatus.status === 'ACTIVE';

  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal(editingGoal?.id || '');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GoalFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(goalSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      targetAmount: 0,
      deadline: '',
      isShared: false,
      initialAmount: 0,
    },
  });

  useEffect(() => {
    if (editingGoal) {
      reset({
        name: editingGoal.name,
        description: editingGoal.description || '',
        targetAmount: editingGoal.targetAmount,
        deadline: editingGoal.deadline,
        isShared: !!editingGoal.coupleId,
        initialAmount: 0,
      });
    } else {
      reset({
        name: '',
        description: '',
        targetAmount: 0,
        deadline: '',
        isShared: false,
        initialAmount: 0,
      });
    }
  }, [editingGoal, reset, isOpen]);

  if (!isOpen) return null;

  const onSubmit = async (data: GoalFormData) => {
    try {
      if (editingGoal) {
        await updateGoal.mutateAsync({
          name: data.name,
          description: data.description,
          targetAmount: data.targetAmount,
          deadline: data.deadline,
        });
        toast.success('Objetivo financeiro atualizado com sucesso!');
      } else {
        await createGoal.mutateAsync({
          name: data.name,
          description: data.description,
          targetAmount: data.targetAmount,
          deadline: data.deadline,
          isShared: data.isShared,
          initialAmount: data.initialAmount,
        });
        toast.success('Objetivo financeiro criado com sucesso!');
      }
      onClose();
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || 'Ocorreu um erro ao salvar o objetivo.');
    }
  };

  const isPending = createGoal.isPending || updateGoal.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
              <Target className="w-4.5 h-4.5" />
            </div>
            <h2 className="text-base font-semibold text-text-primary">
              {editingGoal ? 'Editar Objetivo' : 'Novo Objetivo'}
            </h2>
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
            label="Nome do Objetivo"
            placeholder="Ex: Reserva de Emergência, Viagem Disney..."
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            label="Descrição (Opcional)"
            placeholder="Adicione alguns detalhes sobre a meta..."
            error={errors.description?.message}
            {...register('description')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Valor-Alvo (R$)"
              type="number"
              step="0.01"
              placeholder="0,00"
              error={errors.targetAmount?.message}
              {...register('targetAmount')}
            />

            <Input
              label="Prazo de Conclusão"
              type="date"
              error={errors.deadline?.message}
              {...register('deadline')}
            />
          </div>

          {!editingGoal && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Valor Inicial (Opcional)"
                type="number"
                step="0.01"
                placeholder="0,00"
                error={errors.initialAmount?.message}
                {...register('initialAmount')}
              />

              {isCoupleActive && (
                <Select
                  label="Tipo de Objetivo"
                  error={errors.isShared?.message}
                  {...register('isShared', {
                    setValueAs: (v) => v === 'true',
                  })}
                >
                  <option value="false">Objetivo Individual</option>
                  <option value="true">Objetivo do Casal</option>
                </Select>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={isPending}>
              {editingGoal ? 'Salvar Alterações' : 'Criar Objetivo'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
