import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { MoneyValue } from '@/components/ui/MoneyValue';
import { errorMessage } from '@/services/errors';
import { formatDate } from '@/utils/formatters';
import { useDeletePurchase } from '../hooks/useCardMutations';
import type { InvoiceItem } from '../types';

function categoryLabel(item: InvoiceItem) {
  if (!item.categoryName) return '';
  return item.parentCategoryName ? `${item.parentCategoryName} › ${item.categoryName}` : item.categoryName;
}

export function InvoiceItems({ items }: { items: InvoiceItem[] }) {
  return (
    <ul aria-label="Itens da fatura" className="divide-y divide-border-subtle">
      {items.map((item) => (
        <InvoiceItemRow key={item.id} item={item} />
      ))}
    </ul>
  );
}

function InvoiceItemRow({ item }: { item: InvoiceItem }) {
  const remove = useDeletePurchase();
  const [confirming, setConfirming] = useState(false);
  const installments = item.totalInstallments;

  const deletePurchase = async () => {
    try {
      await remove.mutateAsync(item.id);
      toast.success(installments ? 'Compra e parcelas excluídas.' : 'Compra excluída.');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setConfirming(false);
    }
  };

  return (
    <li className="flex items-center gap-4 px-6 py-3">
      <span className="w-12 shrink-0 text-xs text-text-muted">{formatDate(item.purchaseDate).slice(0, 5)}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">
          {item.description}
          {installments && (
            <span className="ml-2 rounded-full bg-bg-elevated px-2 text-xs text-text-label">
              {item.installmentNumber}/{installments}
            </span>
          )}
        </p>
        <p className="truncate text-xs text-text-muted">{categoryLabel(item)}</p>
      </div>
      <MoneyValue amount={-item.amount} className="text-sm font-semibold" aria-label={`Valor de ${item.description}`} />
      {!item.paid &&
        (confirming ? (
          <Button variant="destructive" size="sm" onClick={deletePurchase} disabled={remove.isPending}>
            {installments ? `Excluir as ${installments} parcelas` : 'Confirmar exclusão'}
          </Button>
        ) : (
          <Button variant="ghost" size="icon" aria-label={`Excluir ${item.description}`} onClick={() => setConfirming(true)}>
            <Trash2 />
          </Button>
        ))}
    </li>
  );
}
