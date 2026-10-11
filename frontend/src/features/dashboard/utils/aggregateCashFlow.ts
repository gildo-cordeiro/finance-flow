import type { Transaction } from '../../transactions/types';
import type { ChartPoint } from '../components/CashFlowChart';

export function aggregateTransactionsByMonth(
  txs: Transaction[],
  currentMonthStr: string,
  userId: string,
  isCoupleContext: boolean
): ChartPoint[] {
  const [year, month] = currentMonthStr.split('-').map(Number);
  const data: ChartPoint[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1);
    const yStr = d.getFullYear();
    const mStr = String(d.getMonth() + 1).padStart(2, '0');
    const monthKey = `${yStr}-${mStr}`;

    const monthName = d
      .toLocaleDateString('pt-BR', { month: 'short' })
      .replace('.', '')
      .replace(/^\w/, (c) => c.toUpperCase());

    const monthTxs = txs.filter((t) => t.competenceDate.startsWith(monthKey));

    const totalRevenue = monthTxs
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = monthTxs
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    let userRevenue = 0;
    let userExpenses = 0;
    let partnerRevenue = 0;
    let partnerExpenses = 0;

    if (isCoupleContext) {
      userRevenue = monthTxs
        .filter((t) => t.type === 'INCOME' && t.userId === userId)
        .reduce((sum, t) => sum + t.amount, 0);

      userExpenses = monthTxs
        .filter((t) => t.type === 'EXPENSE' && t.userId === userId)
        .reduce((sum, t) => sum + t.amount, 0);

      partnerRevenue = totalRevenue - userRevenue;
      partnerExpenses = totalExpenses - userExpenses;
    }

    const isProjected =
      monthTxs.length > 0 &&
      monthTxs.every(
        (t) => t.status === 'PLANNED' || (t.isRecurring && t.status !== 'PAID')
      );

    data.push({
      name: monthName,
      receitas: totalRevenue,
      despesas: totalExpenses,
      userRevenue,
      userExpenses,
      partnerRevenue,
      partnerExpenses,
      projected: isProjected,
    });
  }

  return data;
}
