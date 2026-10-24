import { useState } from 'react';
import { Check, Pencil, Trash2, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { errorMessage } from '@/services/errors';
import { useDeleteTransaction, useSetTransactionPaid } from '../hooks/useTransactionMutations';
import type { Transaction } from '../types';

/** Parcelas, transferências e compras no cartão têm fluxos próprios (F1-12 a F1-14). */
function isEditableHere(transaction: Transaction) {
  return transaction.type !== 'TRANSFER' && transaction.totalInstallments === null;
}

interface TransactionActionsProps {
  transaction: Transaction;
  onEdit: () => void;
}

export function TransactionActions({ transaction, onEdit }: TransactionActionsProps) {
  const setPaid = useSetTransactionPaid();
  const remove = useDeleteTransaction();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const busy = setPaid.isPending || remove.isPending;
  const paid = transaction.status === 'PAID';

  if (!isEditableHere(transaction)) return null;

  const togglePaid = async () => {
    try {
      await setPaid.mutateAsync({ id: transaction.id, paid: !paid });
      toast.success(paid ? 'Pagamento desfeito.' : 'Marcada como paga.');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const deleteTransaction = async () => {
    try {
      await remove.mutateAsync(transaction.id);
      toast.success('Transação excluída.');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setConfirmingDelete(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        aria-label={`${paid ? 'Desfazer pagamento de' : 'Marcar como paga'} ${transaction.description}`}
        title={paid ? 'Desfazer pagamento' : 'Marcar como paga'}
        onClick={togglePaid}
        disabled={busy}
      >
        {paid ? <Undo2 /> : <Check />}
      </Button>
      <Button variant="ghost" size="icon" aria-label={`Editar ${transaction.description}`} onClick={onEdit} disabled={busy}>
        <Pencil />
      </Button>
      {confirmingDelete ? (
        <Button variant="destructive" size="sm" onClick={deleteTransaction} disabled={busy}>
          Confirmar exclusão
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Excluir ${transaction.description}`}
          onClick={() => setConfirmingDelete(true)}
          disabled={busy}
        >
          <Trash2 />
        </Button>
      )}
    </div>
  );
}
