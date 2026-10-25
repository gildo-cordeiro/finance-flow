import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Pencil, ReceiptText, Trash2, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { RowMenu } from '@/components/ui/RowMenu';
import { errorMessage } from '@/services/errors';
import { useDeleteTransaction, useSetTransactionPaid } from '../hooks/useTransactionMutations';
import type { Transaction } from '../types';

/** Parcelas, transferências e compras no cartão têm fluxos próprios (F1-12 a F1-14). */
function isEditableHere(transaction: Transaction) {
  return transaction.type !== 'TRANSFER' && transaction.totalInstallments === null && transaction.invoiceId === null;
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

  const menuLabel = `Ações de ${transaction.description}`;

  if (transaction.invoiceId) {
    return (
      <div className="flex justify-end">
        <RowMenu label={menuLabel}>
          <DropdownMenuItem asChild>
            <Link to={`/cartoes/${transaction.accountId}/faturas/${transaction.invoiceId}`}>
              <ReceiptText />
              Ver fatura
            </Link>
          </DropdownMenuItem>
        </RowMenu>
      </div>
    );
  }
  if (!isEditableHere(transaction)) return null;

  const togglePaid = async () => {
    try {
      await setPaid.mutateAsync({ id: transaction.id, paid: !paid });
      toast.success(paid ? 'Pagamento desfeito.' : transaction.type === 'INCOME' ? 'Marcada como recebida.' : 'Marcada como paga.');
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

  if (confirmingDelete) {
    return (
      <div className="flex items-center justify-end gap-1">
        <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)} disabled={busy}>
          Cancelar
        </Button>
        <Button variant="destructive" size="sm" onClick={deleteTransaction} disabled={busy}>
          Confirmar exclusão
        </Button>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <RowMenu label={menuLabel} disabled={busy}>
        <DropdownMenuItem onSelect={togglePaid}>
          {paid ? <Undo2 /> : <Check />}
          {paid ? 'Desfazer pagamento' : transaction.type === 'INCOME' ? 'Marcar como recebida' : 'Marcar como paga'}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onEdit}>
          <Pencil />
          Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-danger focus:text-danger" onSelect={() => setConfirmingDelete(true)}>
          <Trash2 />
          Excluir
        </DropdownMenuItem>
      </RowMenu>
    </div>
  );
}
