import { useState } from 'react';
import { Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { MoneyValue } from '@/components/ui/MoneyValue';
import { errorMessage } from '@/services/errors';
import { formatDate } from '@/utils/formatters';
import { useReversePayment } from '../hooks/useCardMutations';
import type { InvoicePayment } from '../types';

export function InvoicePayments({ invoiceId, payments }: { invoiceId: string; payments: InvoicePayment[] }) {
  const reverse = useReversePayment();
  const [confirming, setConfirming] = useState<string | null>(null);

  const onReverse = async (paymentId: string) => {
    try {
      await reverse.mutateAsync({ invoiceId, paymentId });
      toast.success('Pagamento estornado.');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setConfirming(null);
    }
  };

  return (
    <ul aria-label="Pagamentos da fatura" className="divide-y divide-border-subtle">
      {payments.map((payment) => (
        <li key={payment.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-text-primary">Pago em {formatDate(payment.paymentDate)}</p>
            <p className="truncate text-xs text-text-muted">{payment.fromAccountName ?? 'Conta excluída'}</p>
          </div>
          <MoneyValue amount={payment.amount} className="text-sm" />
          {confirming === payment.id ? (
            <Button variant="destructive" size="sm" disabled={reverse.isPending} onClick={() => onReverse(payment.id)}>
              Confirmar estorno
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Estornar pagamento de ${formatDate(payment.paymentDate)}`}
              disabled={reverse.isPending}
              onClick={() => setConfirming(payment.id)}
            >
              <Undo2 />
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
