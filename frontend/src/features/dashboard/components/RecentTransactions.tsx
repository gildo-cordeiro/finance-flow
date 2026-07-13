import { useNavigate } from 'react-router-dom';
import { cn } from '../../../lib/cn';
import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { MoneyValue } from '../../../components/ui/MoneyValue';
import { formatDate } from '../../../utils/formatters';
import {
  Coffee,
  Car,
  Home,
  Heart,
  FileText,
  Smile,
  ShoppingBag,
  DollarSign,
  PiggyBank,
  Briefcase,
  Wrench,
  Tag,
} from 'lucide-react';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  categoryId?: string | null;
  competenceDate: string;
}

interface Category {
  id: string;
  name: string;
}

interface RecentTransactionsProps {
  recentTransactions: Transaction[];
  categories: Category[];
}

// Category to Icon mapping helper
const getCategoryIcon = (categoryName?: string) => {
  const name = categoryName?.toLowerCase() || '';
  if (
    name.includes('alimentação') ||
    name.includes('comida') ||
    name.includes('mercado') ||
    name.includes('restaurante') ||
    name.includes('supermercado')
  ) {
    return Coffee;
  }
  if (
    name.includes('transporte') ||
    name.includes('carro') ||
    name.includes('combustível') ||
    name.includes('uber') ||
    name.includes('moto')
  ) {
    return Car;
  }
  if (
    name.includes('moradia') ||
    name.includes('casa') ||
    name.includes('aluguel') ||
    name.includes('energia') ||
    name.includes('água') ||
    name.includes('internet')
  ) {
    return Home;
  }
  if (
    name.includes('saúde') ||
    name.includes('farmácia') ||
    name.includes('médico') ||
    name.includes('dentista') ||
    name.includes('hospital')
  ) {
    return Heart;
  }
  if (
    name.includes('educação') ||
    name.includes('curso') ||
    name.includes('faculdade') ||
    name.includes('escola') ||
    name.includes('livro')
  ) {
    return FileText;
  }
  if (
    name.includes('lazer') ||
    name.includes('viagem') ||
    name.includes('cinema') ||
    name.includes('show') ||
    name.includes('diversão')
  ) {
    return Smile;
  }
  if (
    name.includes('compras') ||
    name.includes('roupa') ||
    name.includes('eletrônico') ||
    name.includes('presente') ||
    name.includes('shopping')
  ) {
    return ShoppingBag;
  }
  if (
    name.includes('salário') ||
    name.includes('renda') ||
    name.includes('investimento') ||
    name.includes('ganho') ||
    name.includes('receita')
  ) {
    return DollarSign;
  }
  if (name.includes('investimentos') || name.includes('poupança') || name.includes('reserva')) {
    return PiggyBank;
  }
  if (name.includes('trabalho') || name.includes('freelance') || name.includes('serviço')) {
    return Briefcase;
  }
  if (name.includes('serviços') || name.includes('manutenção') || name.includes('reforma')) {
    return Wrench;
  }
  return Tag;
};

export function RecentTransactions({ recentTransactions, categories }: RecentTransactionsProps) {
  const navigate = useNavigate();

  return (
    <Card className="p-6 flex flex-col justify-between h-96">
      <div>
        <h3 className="text-xl font-bold tracking-tight">Transações Recentes</h3>
        <p className="text-zinc-400 text-xs mt-1">Últimos lançamentos deste mês.</p>
      </div>

      <div className="flex-1 my-6 overflow-hidden">
        {recentTransactions.length === 0 ? (
          <EmptyState
            title="Nenhuma transação"
            description="Nenhuma transação lançada neste mês."
            action={
              <button
                onClick={() => navigate('/transactions')}
                className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs rounded-lg transition-colors"
              >
                Adicionar Transação
              </button>
            }
          />
        ) : (
          <div className="space-y-4">
            {recentTransactions.map((t) => {
              const cat = categories.find((c) => c.id === t.categoryId);
              const categoryName = cat ? cat.name : 'Outros';
              const Icon = getCategoryIcon(categoryName);
              const isIncome = t.type === 'INCOME';

              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between border-b border-border-subtle/50 pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        'p-2 rounded-xl shrink-0',
                        isIncome ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate" title={t.description}>
                        {t.description}
                      </p>
                      <p className="text-xs text-text-secondary">{formatDate(t.competenceDate)}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <MoneyValue
                      amount={isIncome ? t.amount : -t.amount}
                      showSign={true}
                      className={cn('text-sm font-bold', isIncome ? 'text-success' : 'text-danger')}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button
        onClick={() => navigate('/transactions')}
        className="w-full text-center text-xs font-semibold text-brand hover:text-violet-400 transition-colors pt-2 border-t border-border-subtle/50"
      >
        Ver todas
      </button>
    </Card>
  );
}
