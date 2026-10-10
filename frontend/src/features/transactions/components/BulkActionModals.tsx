import { X, Info, AlertTriangle } from 'lucide-react';

interface BulkActionModalsProps {
  isBulkUpdateOpen: boolean;
  onBulkUpdateClose: () => void;
  onConfirmBulkUpdate: (mode: 'ONLY_THIS' | 'ALL') => void;
  isBulkDeleteOpen: boolean;
  onBulkDeleteClose: () => void;
  onConfirmBulkDelete: (mode: 'ONLY_THIS' | 'ALL') => void;
}

export function BulkActionModals({
  isBulkUpdateOpen,
  onBulkUpdateClose,
  onConfirmBulkUpdate,
  isBulkDeleteOpen,
  onBulkDeleteClose,
  onConfirmBulkDelete,
}: BulkActionModalsProps) {
  return (
    <>
      {/* Bulk Update Modal */}
      {isBulkUpdateOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="auth-card w-full max-w-md p-6 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Info className="w-5 h-5 text-violet-400" />
                Editar Lançamento Recorrente
              </h2>
              <button onClick={onBulkUpdateClose} className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-zinc-300">
              Este lançamento faz parte de um grupo (parcelamento ou recorrência). Deseja atualizar apenas este lançamento ou todos os lançamentos do grupo?
            </p>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onConfirmBulkUpdate('ONLY_THIS')}
                className="w-full py-2.5 bg-bg-elevated hover:bg-zinc-800 active:bg-zinc-900 border border-zinc-700 text-sm font-semibold rounded-xl transition-all"
              >
                Atualizar apenas este
              </button>
              <button
                type="button"
                onClick={() => onConfirmBulkUpdate('ALL')}
                className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-sm font-semibold rounded-xl shadow-lg shadow-violet-500/25 transition-all"
              >
                Atualizar toda a série
              </button>
              <button
                type="button"
                onClick={onBulkUpdateClose}
                className="w-full py-2.5 text-zinc-400 hover:text-white text-sm font-semibold transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {isBulkDeleteOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="auth-card w-full max-w-md p-6 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h2 className="text-xl font-bold flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-5 h-5" />
                Excluir Lançamento Recorrente
              </h2>
              <button onClick={onBulkDeleteClose} className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-zinc-300">
              Este lançamento faz parte de um grupo (parcelamento ou recorrência). Deseja excluir apenas este lançamento ou todos os lançamentos do grupo?
            </p>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onConfirmBulkDelete('ONLY_THIS')}
                className="w-full py-2.5 bg-bg-elevated hover:bg-zinc-800 active:bg-zinc-900 border border-zinc-700 text-sm font-semibold rounded-xl transition-all"
              >
                Excluir apenas este
              </button>
              <button
                type="button"
                onClick={() => onConfirmBulkDelete('ALL')}
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-sm font-semibold rounded-xl shadow-lg shadow-red-500/25 transition-all"
              >
                Excluir toda a série
              </button>
              <button
                type="button"
                onClick={onBulkDeleteClose}
                className="w-full py-2.5 text-zinc-400 hover:text-white text-sm font-semibold transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
