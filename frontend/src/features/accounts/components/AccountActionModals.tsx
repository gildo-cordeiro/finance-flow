import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../../../lib/cn';
import { Button } from '../../../components/ui/Button';


interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  danger?: boolean;
  errorMessage?: string | null;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  loading,
  danger,
  errorMessage,
}: ConfirmModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-bg-surface border border-border-subtle w-full max-w-md p-7 relative rounded-2xl animate-in fade-in zoom-in-95 duration-200 space-y-5">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-text-secondary hover:text-white p-1.5 hover:bg-bg-elevated rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="space-y-2">
          <h3 className={cn('text-lg font-bold', danger ? 'text-danger' : 'text-text-primary')}>
            {title}
          </h3>
          <p className="text-sm text-text-secondary">{description}</p>
        </div>
        {errorMessage && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-danger text-sm flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl border border-border-subtle hover:bg-bg-elevated text-text-secondary text-sm font-medium transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <Button
            onClick={onConfirm}
            loading={loading}
            className={cn('px-5', danger ? 'bg-red-600 hover:bg-red-700 shadow-red-900/20' : '')}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export type ConfirmAction = 'archive' | 'unarchive' | 'close' | 'delete';

export const confirmConfig: Record<
  ConfirmAction,
  { title: string; description: string; label: string; danger?: boolean }
> = {
  archive: {
    title: 'Arquivar?',
    description: 'Ficará oculto das listas principais. Você pode reativar quando quiser.',
    label: 'Arquivar',
  },
  unarchive: {
    title: 'Reativar?',
    description: 'Voltará a aparecer normalmente nas listas e relatórios.',
    label: 'Reativar',
  },
  close: {
    title: 'Encerrar conta?',
    description:
      'A conta será encerrada permanentemente. Só é possível encerrar contas com saldo zero. Essa ação não pode ser desfeita.',
    label: 'Encerrar conta',
    danger: true,
  },
  delete: {
    title: 'Excluir permanentemente?',
    description: 'Só é possível excluir contas sem transações. Essa ação não pode ser desfeita.',
    label: 'Excluir',
    danger: true,
  },
};
