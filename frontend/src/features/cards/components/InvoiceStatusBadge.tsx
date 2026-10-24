import { cn } from '@/lib/cn';
import { INVOICE_STATUS_LABELS, type InvoiceStatus } from '../types';

const CLASSES: Record<InvoiceStatus, string> = {
  OPEN: 'bg-info/10 text-info border-info/20',
  CLOSED: 'bg-warning/10 text-warning border-warning/20',
  PAID: 'bg-success/10 text-success border-success/20',
  PARTIALLY_PAID: 'bg-warning/10 text-warning border-warning/20',
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        CLASSES[status]
      )}
    >
      {INVOICE_STATUS_LABELS[status]}
    </span>
  );
}
