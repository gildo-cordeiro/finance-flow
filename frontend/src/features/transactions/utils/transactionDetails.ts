import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Account } from '../../accounts/types';
import { Transaction } from '../types';

// Helper to parse date string YYYY-MM-DD safely into Date without timezone offsets
export const parseDateParts = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m, d);
    }
  }
  return new Date();
};

// Helper to determine invoice month based on card closing day and temporal-competence rule
export const getInvoiceMonthText = (card: Account | undefined, dueDateStr: string): string => {
  if (!card?.closingDay || card.closingDay <= 0) {
    return 'Entra na próxima fatura';
  }

  const txDate = parseDateParts(dueDateStr);

  // temporal-competence: compra até o dia de fechamento entra no mês atual; depois, no mês seguinte
  const compDate =
    txDate.getDate() <= card.closingDay
      ? new Date(txDate.getFullYear(), txDate.getMonth(), 1)
      : new Date(txDate.getFullYear(), txDate.getMonth() + 1, 1);

  const monthName = format(compDate, 'MMMM', { locale: ptBR });
  return `Entra na fatura de ${monthName}`;
};

// Helper to determine if a transaction has non-default details in the collapsible area
export const hasNonDefaultDetails = (
  tx: Transaction | null,
  accountsList: Account[]
): boolean => {
  if (!tx) return false;

  // 1. Repetição não padrão (qualquer repetição além de Único / SINGLE)
  if (
    tx.installmentGroupId ||
    (tx.totalInstallments && tx.totalInstallments > 1) ||
    tx.isRecurring
  ) {
    return true;
  }

  // 2. Competência não padrão
  if (tx.competenceDate) {
    const compMonth = tx.competenceDate.slice(0, 7);
    const acc = accountsList.find((a) => a.id === tx.accountId);
    if (acc?.type === 'CREDIT_CARD' && acc.closingDay && tx.dueDate) {
      const txDate = parseDateParts(tx.dueDate);
      const expectedDate =
        txDate.getDate() <= acc.closingDay
          ? new Date(txDate.getFullYear(), txDate.getMonth(), 1)
          : new Date(txDate.getFullYear(), txDate.getMonth() + 1, 1);
      const expectedMonth = format(expectedDate, 'yyyy-MM');
      if (compMonth !== expectedMonth) return true;
    } else if (tx.dueDate) {
      const dueMonth = tx.dueDate.slice(0, 7);
      if (compMonth !== dueMonth) return true;
    } else {
      return true;
    }
  }

  return false;
};
