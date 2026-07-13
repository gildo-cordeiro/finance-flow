import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Card } from '../../../components/ui/Card';
import { MoneyValue } from '../../../components/ui/MoneyValue';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  categoryId?: string | null;
  competenceDate: string;
}

interface Category {
  id: string;
  name: string;
}

interface CategoryExpensesChartProps {
  transactions: Transaction[];
  categories: Category[];
  currentMonth: string;
}

const COLORS = [
  '#7C5CFC', // Brand Violet
  '#3B82F6', // Info Blue
  '#EC4899', // Pink
  '#F59E0B', // Warning Amber
  '#10B981', // Success Emerald
  '#EF4444', // Danger Red
  '#8B5CF6', // Purple
  '#14B8A6', // Teal
];

export function CategoryExpensesChart({
  transactions,
  categories,
  currentMonth,
}: CategoryExpensesChartProps) {
  // Filter for expenses of current month
  const expenses = transactions.filter(
    (t) => t.type === 'EXPENSE' && t.competenceDate.startsWith(currentMonth)
  );

  // Group by category
  const groups: Record<string, number> = {};
  expenses.forEach((t) => {
    const catId = t.categoryId || 'unknown';
    groups[catId] = (groups[catId] || 0) + t.amount;
  });

  const chartData = Object.entries(groups)
    .map(([catId, amount]) => {
      const categoryName = categories.find((c) => c.id === catId)?.name || 'Outros';
      return { name: categoryName, value: amount };
    })
    .sort((a, b) => b.value - a.value);

  const totalExpenses = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="p-6 flex flex-col justify-between h-96">
      <div>
        <h3 className="text-xl font-bold tracking-tight">Despesas por Categoria</h3>
        <p className="text-zinc-400 text-xs mt-1">Distribuição de gastos no mês.</p>
      </div>

      <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-4 mt-4 min-h-0">
        {chartData.length === 0 ? (
          <div className="text-zinc-500 text-sm">Nenhum gasto registrado neste mês.</div>
        ) : (
          <>
            <div className="w-40 h-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#1A1D27" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #3f3f46',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number | string) => [
                      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0)),
                      'Total',
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex-1 space-y-2 max-h-48 overflow-y-auto w-full pr-1">
              {chartData.slice(0, 5).map((item, index) => {
                const percent = totalExpenses > 0 ? Math.round((item.value / totalExpenses) * 100) : 0;
                return (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-zinc-300 font-medium truncate" title={item.name}>
                        {item.name}
                      </span>
                    </div>
                    <div className="text-right shrink-0 ml-2 font-semibold text-zinc-100">
                      <MoneyValue amount={item.value} showSign={false} className="text-zinc-100 font-semibold" />
                      <span className="text-zinc-500 text-[10px] ml-1.5 font-normal">({percent}%)</span>
                    </div>
                  </div>
                );
              })}
              {chartData.length > 5 && (
                <div className="text-center text-[10px] text-text-secondary pt-1">
                  + {chartData.length - 5} categoria(s)
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
