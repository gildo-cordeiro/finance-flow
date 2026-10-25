import { useState } from 'react';
import { Archive, ArchiveRestore, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoneyValue } from '@/components/ui/MoneyValue';
import { RowMenu } from '@/components/ui/RowMenu';
import { errorMessage } from '@/services/errors';
import { useDeleteAccount, useSetAccountArchived } from '../hooks/useAccountMutations';
import { ACCOUNT_TYPE_LABELS, type Account } from '../types';

interface AccountRowProps {
  account: Account;
  onEdit: () => void;
}

export function AccountRow({ account, onEdit }: AccountRowProps) {
  const setArchived = useSetAccountArchived();
  const remove = useDeleteAccount();
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
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3 transition-colors hover:bg-bg-elevated/40">
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-text-primary">
          {account.name}
          {account.archived && <span className="ml-2 text-xs font-normal text-text-muted">(arquivada)</span>}
        </p>
        <p className="truncate text-xs text-text-muted">
          {ACCOUNT_TYPE_LABELS[account.type]}
          {account.bank && ` · ${account.bank}`}
        </p>
      </div>
      <MoneyValue amount={account.balance} showSign={false} aria-label={`Saldo de ${account.name}`} />
      {editable &&
        (confirmingDelete ? (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button variant="destructive" size="sm" onClick={deleteAccount} disabled={busy}>
              Confirmar exclusão
            </Button>
          </div>
        ) : (
          <RowMenu label={`Ações de ${account.name}`} disabled={busy}>
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={toggleArchived}>
              {account.archived ? <ArchiveRestore /> : <Archive />}
              {account.archived ? 'Desarquivar' : 'Arquivar'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-danger focus:text-danger" onSelect={() => setConfirmingDelete(true)}>
              <Trash2 />
              Excluir
            </DropdownMenuItem>
          </RowMenu>
        ))}
    </li>
  );
}
