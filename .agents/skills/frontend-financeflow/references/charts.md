# Gráficos com Recharts (tema dark)

> Referência da skill `frontend-financeflow`. Leia só quando a tarefa envolver este assunto. Regras gerais e convenções confirmadas: `../SKILL.md`.

## 5. Gráficos com Recharts (Tema Dark)

Sempre use `ResponsiveContainer`. Adapte as cores ao tema Dark Premium.

```tsx
// features/cashflow/components/CashFlowChart.tsx
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { formatCurrency } from '@/utils/formatters';

interface ChartData {
  month: string;    // "Jun", "Jul"...
  receitas: number;
  despesas: number;
  saldo: number;
}

export function CashFlowChart({ data }: { data: ChartData[] }) {
  return (
    <div className="glassmorphism p-5 shadow-xl shadow-black/40">
      <h3 className="text-sm font-semibold text-zinc-100 mb-5">Fluxo de Caixa</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradReceitas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradDespesas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f87171" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="#52525b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#71717a' }}
            />
            <YAxis
              stroke="#52525b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#71717a' }}
              tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                border: '1px solid #3f3f46',
                borderRadius: '12px',
                fontSize: '12px',
                color: '#f4f4f5',
              }}
              formatter={(value: number, name: string) => [formatCurrency(value), name]}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '12px', paddingTop: '12px', color: '#a1a1aa' }}
            />
            <Area type="monotone" dataKey="receitas" name="Receitas"
              stroke="#10b981" fill="url(#gradReceitas)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="despesas" name="Despesas"
              stroke="#f87171" fill="url(#gradDespesas)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```
