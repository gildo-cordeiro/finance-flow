import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, ArchiveRestore, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoneyValue } from '@/components/ui/MoneyValue';
import { RowMenu } from '@/components/ui/RowMenu';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { errorMessage } from '@/services/errors';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { useCurrentInvoice } from '../hooks/useCards';
import { useDeleteCard, useSetCardArchived } from '../hooks/useCardMutations';
import type { Card } from '../types';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';

interface CardRowProps {
  card: Card;
  onEdit: () => void;
  onPurchase: () => void;
}

export function CardRow({ card, onEdit, onPurchase }: CardRowProps) {
  const invoice = useCurrentInvoice(card.id);
  const setArchived = useSetCardArchived();
  const remove = useDeleteCard();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const busy = setArchived.isPending || remove.isPending;

  const toggleArchived = async () => {
    try {
      await setArchived.mutateAsync({ id: card.id, archived: !card.archived });
      toast.success(card.archived ? 'Cartão desarquivado.' : 'Cartão arquivado.');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const deleteCard = async () => {
    try {
      await remove.mutateAsync(card.id);
      toast.success('Cartão excluído.');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setConfirmingDelete(false);
    }
  };

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 px-5 py-4 transition-colors hover:bg-bg-elevated/40 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
      <div className="min-w-0">
        <p className="truncate font-semibold text-text-primary">
          {card.name}
          {card.archived && <span className="ml-2 text-xs font-normal text-text-muted">(arquivado)</span>}
        </p>
        <p className="text-xs text-text-muted">
          {card.brand ? `${card.brand} · ` : ''}fecha dia {card.closingDay} · vence dia {card.dueDay}
        </p>
        <div role="group" className="mt-2 max-w-sm" aria-label={`Limite de ${card.name}`}>
          <ProgressBar value={card.used} max={card.creditLimit} label={`Limite usado de ${card.name}`} />
          <p className="mt-1 text-xs text-text-muted">Disponível {formatCurrency(card.available)}</p>
        </div>
      </div>
      <div className="lg:order-last">{actions()}</div>
      <div className="col-span-2 lg:col-span-1">
        {invoice.isPending && <Skeleton className="h-12 w-full lg:w-48" />}
        {invoice.data && (
          <Link
            to={`/cartoes/${card.id}/fatura`}
            className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle px-3 py-2 transition-colors hover:border-brand/40 hover:bg-bg-elevated/40"
            aria-label={`Fatura atual de ${card.name}`}
          >
            <div className="lg:text-right">
              <MoneyValue amount={-invoice.data.total} className="text-sm font-semibold" />
              <p className="text-xs text-text-muted">Vence {formatDate(invoice.data.dueDate)}</p>
            </div>
            <InvoiceStatusBadge status={invoice.data.status} />
          </Link>
        )}
      </div>
    </li>
  );

  function actions() {
    if (confirmingDelete) {
      return (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)} disabled={busy}>
            Cancelar
          </Button>
          <Button variant="destructive" size="sm" onClick={deleteCard} disabled={busy}>
            Confirmar exclusão
          </Button>
        </div>
      );
    }
    return (
      <RowMenu label={`Ações de ${card.name}`} disabled={busy}>
        {!card.archived && (
          <DropdownMenuItem onSelect={onPurchase}>
            <Plus />
            Nova compra
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={onEdit}>
          <Pencil />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={toggleArchived}>
          {card.archived ? <ArchiveRestore /> : <Archive />}
          {card.archived ? 'Desarquivar' : 'Arquivar'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-danger focus:text-danger" onSelect={() => setConfirmingDelete(true)}>
          <Trash2 />
          Excluir
        </DropdownMenuItem>
      </RowMenu>
    );
  }
}
