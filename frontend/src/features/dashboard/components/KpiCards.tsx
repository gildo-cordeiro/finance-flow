import { ArrowUpRight, ArrowDownRight, Coins, Calendar } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { SectionLabel } from '../../../components/ui/SectionLabel';
import { MoneyValue } from '../../../components/ui/MoneyValue';
import { cn } from '../../../lib/cn';
import type { DashboardSummary } from '../types';

interface KpiCardsProps {
  summary: DashboardSummary;
  totalBalance: number;
  totalUnpaidNext7Days: number;
  isCouple: boolean;
}

export function KpiCards({
  summary,
  totalBalance,
  totalUnpaidNext7Days,
  isCouple,
}: KpiCardsProps) {
  const breakdown = summary.memberBreakdown;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Revenue Card */}
      <Card className="hover:border-success/20 transition-all duration-300 relative group overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-success/5 rounded-full blur-2xl group-hover:bg-success/10 transition-all"></div>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <SectionLabel className="block mb-1">Receitas do Mês</SectionLabel>
            <div className="text-2xl font-bold text-white">
              <MoneyValue amount={summary.totalRevenue} showSign={false} className="text-white font-bold" />
            </div>
            {isCouple && breakdown && (
              <p className="text-xs text-text-secondary mt-1">
                Meu: <MoneyValue amount={breakdown.userRevenue} showSign={false} className="font-medium text-text-secondary animate-none" /> | Casal: <MoneyValue amount={breakdown.partnerRevenue} showSign={false} className="font-medium text-text-secondary animate-none" />
              </p>
            )}
          </div>
          <div className="p-2.5 bg-success/10 text-success rounded-xl">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
      </Card>

      {/* Expense Card */}
      <Card className="hover:border-danger/20 transition-all duration-300 relative group overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-danger/5 rounded-full blur-2xl group-hover:bg-danger/10 transition-all"></div>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <SectionLabel className="block mb-1">Despesas do Mês</SectionLabel>
            <div className="text-2xl font-bold text-white">
              <MoneyValue amount={summary.totalExpenses} showSign={false} className="text-white font-bold" />
            </div>
            {isCouple && breakdown && (
              <p className="text-xs text-text-secondary mt-1">
                Meu: <MoneyValue amount={breakdown.userExpenses} showSign={false} className="font-medium text-text-secondary animate-none" /> | Casal: <MoneyValue amount={breakdown.partnerExpenses} showSign={false} className="font-medium text-text-secondary animate-none" />
              </p>
            )}
          </div>
          <div className="p-2.5 bg-danger/10 text-danger rounded-xl">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>
      </Card>

      {/* Balance Card */}
      <Card className="hover:border-info/20 transition-all duration-300 relative group overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-info/5 rounded-full blur-2xl group-hover:bg-info/10 transition-all"></div>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <SectionLabel className="block mb-1">Saldo Atual</SectionLabel>
            <div className="text-2xl font-bold text-white">
              <MoneyValue amount={totalBalance} showSign={false} className="text-white font-bold animate-none" />
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Soma das contas
            </p>
          </div>
          <div className={cn(
            "p-2.5 rounded-xl",
            totalBalance >= 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
          )}>
            <Coins className="w-5 h-5" />
          </div>
        </div>
      </Card>

      {/* A Pagar Card */}
      <Card className="hover:border-warning/20 transition-all duration-300 relative group overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-warning/5 rounded-full blur-2xl group-hover:bg-warning/10 transition-all"></div>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <SectionLabel className="block mb-1">A Pagar</SectionLabel>
            <div className="text-2xl font-bold text-white">
              <MoneyValue amount={totalUnpaidNext7Days} showSign={false} className="text-white font-bold animate-none" />
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Vencimentos próximos 7 dias
            </p>
          </div>
          <div className="p-2.5 bg-warning/10 text-warning rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </Card>
    </div>
  );
}
