import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { Card } from '../../../components/ui/Card';
import { MoneyValue } from '../../../components/ui/MoneyValue';

export interface ChartPoint {
  name: string;
  receitas: number;
  despesas: number;
  userRevenue: number;
  userExpenses: number;
  partnerRevenue: number;
  partnerExpenses: number;
  projected?: boolean;
}

interface CashFlowChartProps {
  chartData: ChartPoint[];
  isCouple: boolean;
  partnerName: string;
}

export function CashFlowChart({ chartData, isCouple, partnerName }: CashFlowChartProps) {
  interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
      payload: ChartPoint;
    }>;
    label?: string;
  }

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-4 shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-border-subtle pb-1.5 gap-4">
            <p className="text-sm font-bold text-white">{label}</p>
            {data.projected && (
              <span className="text-xs font-normal text-text-muted">
                (Projetado)
              </span>
            )}
          </div>
          <div className="space-y-2">
            {/* Receitas */}
            <div className="space-y-1">
              <div className="flex justify-between items-center gap-6">
                <span className="text-success text-xs font-semibold">Receitas:</span>
                <MoneyValue amount={data.receitas} showSign={false} className="text-success text-xs font-bold" />
              </div>
              {isCouple && (
                <div className="text-xs text-text-secondary pl-2 flex flex-col gap-0.5 border-l border-success/20">
                  <span>Meu: <MoneyValue amount={data.userRevenue} showSign={false} className="font-normal text-text-secondary" /></span>
                  <span>{partnerName}: <MoneyValue amount={data.partnerRevenue} showSign={false} className="font-normal text-text-secondary" /></span>
                </div>
              )}
            </div>
            {/* Despesas */}
            <div className="space-y-1 border-t border-border-subtle/50 pt-2">
              <div className="flex justify-between items-center gap-6">
                <span className="text-danger text-xs font-semibold">Despesas:</span>
                <MoneyValue amount={data.despesas} showSign={false} className="text-danger text-xs font-bold" />
              </div>
              {isCouple && (
                <div className="text-xs text-text-secondary pl-2 flex flex-col gap-0.5 border-l border-danger/20">
                  <span>Meu: <MoneyValue amount={data.userExpenses} showSign={false} className="font-normal text-text-secondary" /></span>
                  <span>{partnerName}: <MoneyValue amount={data.partnerExpenses} showSign={false} className="font-normal text-text-secondary animate-none" /></span>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const hasProjected = chartData.some((point) => point.projected);

  const renderLegend = () => {
    return (
      <div className="flex items-center justify-center gap-4 pt-3 text-[11px] text-text-muted">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-success" />
          <span>Receitas</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-danger" />
          <span>Despesas</span>
        </div>
        {hasProjected && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-text-muted/40 border border-text-muted/30" />
            <span>Projetado</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="lg:col-span-2 p-6 flex flex-col justify-between">
      <div>
        <h3 className="text-xl font-bold tracking-tight">Fluxo de Caixa</h3>
        <p className="text-zinc-400 text-xs mt-1">Histórico de receitas e despesas dos últimos 6 meses.</p>
      </div>

      <div className="h-72 w-full mt-6">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-text-muted text-sm">
            Nenhum dado de fluxo de caixa disponível.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 10, left: -10, bottom: 5 }}>
              <XAxis
                dataKey="name"
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#71717a' }}
              />
              <YAxis
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#71717a' }}
                tickFormatter={(v) => `R$ ${v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={renderLegend} />
              <Bar dataKey="receitas" name="Receitas" fill="#22C55E" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-receitas-${index}`}
                    fill="#22C55E"
                    fillOpacity={entry.projected ? 0.4 : 1}
                    opacity={entry.projected ? 0.4 : 1}
                  />
                ))}
              </Bar>
              <Bar dataKey="despesas" name="Despesas" fill="#EF4444" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-despesas-${index}`}
                    fill="#EF4444"
                    fillOpacity={entry.projected ? 0.4 : 1}
                    opacity={entry.projected ? 0.4 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
