import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, ArchiveRestore, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { MoneyValue } from '@/components/ui/MoneyValue';
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
    <li className="flex flex-col gap-3 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <p className="truncate font-semibold text-text-primary">
          {card.name}
          {card.archived && <span className="ml-2 text-xs font-normal text-text-muted">(arquivado)</span>}
        </p>
        <p className="text-xs text-text-muted">
          {card.brand ? `${card.brand} · ` : ''}fecha dia {card.closingDay} · vence dia {card.dueDay} · limite{' '}
          {formatCurrency(card.creditLimit)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        {invoice.isPending && <Skeleton className="h-8 w-40" />}
        {invoice.data && (
          <Link
            to={`/cartoes/${card.id}/fatura`}
            className="flex items-center gap-3 rounded-lg border border-border-subtle px-3 py-2 hover:border-brand/40"
            aria-label={`Fatura atual de ${card.name}`}
          >
            <div className="text-right">
              <MoneyValue amount={-invoice.data.total} className="text-sm font-semibold" />
              <p className="text-xs text-text-muted">Vence {formatDate(invoice.data.dueDate)}</p>
            </div>
            <InvoiceStatusBadge status={invoice.data.status} />
          </Link>
        )}
        <div className="flex items-center gap-1">
          {!card.archived && (
            <Button variant="ghost" size="icon" aria-label={`Nova compra em ${card.name}`} onClick={onPurchase} disabled={busy}>
              <Plus />
            </Button>
          )}
          <Button variant="ghost" size="icon" aria-label={`Editar ${card.name}`} onClick={onEdit} disabled={busy}>
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`${card.archived ? 'Desarquivar' : 'Arquivar'} ${card.name}`}
            onClick={toggleArchived}
            disabled={busy}
          >
            {card.archived ? <ArchiveRestore /> : <Archive />}
          </Button>
          {confirmingDelete ? (
            <Button variant="destructive" size="sm" onClick={deleteCard} disabled={busy}>
              Confirmar exclusão
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Excluir ${card.name}`}
              onClick={() => setConfirmingDelete(true)}
              disabled={busy}
            >
              <Trash2 />
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}
