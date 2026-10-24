import { useState } from 'react';
import { Archive, ArchiveRestore, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { MoneyValue } from '@/components/ui/MoneyValue';
import { errorMessage } from '@/services/errors';
import { useAccountMutations } from '../hooks/useAccountMutations';
import { ACCOUNT_TYPE_LABELS, type Account } from '../types';

interface AccountRowProps {
  account: Account;
  onEdit: () => void;
}

export function AccountRow({ account, onEdit }: AccountRowProps) {
  const { setArchived, remove } = useAccountMutations();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  // Cartões são editados no cadastro próprio (F1-14)
  const editable = account.type !== 'CREDIT_CARD';
  const busy = setArchived.isPending || remove.isPending;

  const toggleArchived = async () => {
    try {
      await setArchived.mutateAsync({ id: account.id, archived: !account.archived });
      toast.success(account.archived ? 'Conta desarquivada.' : 'Conta arquivada.');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const deleteAccount = async () => {
    try {
      await remove.mutateAsync(account.id);
      toast.success('Conta excluída.');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setConfirmingDelete(false);
    }
  };

  return (
    <li className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate font-semibold text-text-primary">
          {account.name}
          {account.archived && <span className="ml-2 text-xs font-normal text-text-muted">(arquivada)</span>}
        </p>
        <p className="text-xs text-text-muted">
          {ACCOUNT_TYPE_LABELS[account.type]}
          {account.bank && ` · ${account.bank}`}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <MoneyValue amount={account.balance} showSign={false} aria-label={`Saldo de ${account.name}`} />
        {editable && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label={`Editar ${account.name}`} onClick={onEdit} disabled={busy}>
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`${account.archived ? 'Desarquivar' : 'Arquivar'} ${account.name}`}
              onClick={toggleArchived}
              disabled={busy}
            >
              {account.archived ? <ArchiveRestore /> : <Archive />}
            </Button>
            {confirmingDelete ? (
              <Button variant="destructive" size="sm" onClick={deleteAccount} disabled={busy}>
                Confirmar exclusão
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Excluir ${account.name}`}
                onClick={() => setConfirmingDelete(true)}
                disabled={busy}
              >
                <Trash2 />
              </Button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
