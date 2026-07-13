import { Plus, Trash2, TrendingUp } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { formatDate } from '../../../utils/formatters';

interface Contribution {
  id: string;
  amount: number;
  contributionDate: string;
  type: 'MANUAL' | 'AUTOMATIC';
  note?: string | null;
}

interface ContributionHistoryProps {
  contributions: Contribution[];
  onDeleteContribution: (id: string) => void;
  onAddContributionClick: () => void;
}

export function ContributionHistory({
  contributions,
  onDeleteContribution,
  onAddContributionClick,
}: ContributionHistoryProps) {
  return (
    <Card className="space-y-6">
      <div className="flex justify-between items-center border-b border-border-subtle pb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-brand" />
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
            Histórico de Contribuições
          </h3>
        </div>
        <Button
          onClick={onAddContributionClick}
          className="flex items-center gap-2 py-1.5 px-3 text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Registrar Aporte
        </Button>
      </div>

      {contributions.length === 0 ? (
        <EmptyState
          title="Nenhuma contribuição realizada"
          description="Registre uma contribuição manual ou vincule transações para ver o histórico aqui."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-text-muted border-b border-white/[0.04] text-xs uppercase tracking-wider">
                <th className="pb-3 font-semibold">Data</th>
                <th className="pb-3 font-semibold">Valor</th>
                <th className="pb-3 font-semibold">Origem</th>
                <th className="pb-3 font-semibold">Observação</th>
                <th className="pb-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {contributions.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="py-4 text-text-primary font-medium">
                    {formatDate(c.contributionDate)}
                  </td>
                  <td className="py-4 font-bold text-success">
                    R$ {c.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-4">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        c.type === 'AUTOMATIC'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}
                    >
                      {c.type === 'AUTOMATIC' ? 'Transação Automática' : 'Manual'}
                    </span>
                  </td>
                  <td className="py-4 text-text-secondary max-w-xs truncate">{c.note || '-'}</td>
                  <td className="py-4 text-right">
                    {c.type === 'MANUAL' && (
                      <button
                        onClick={() => onDeleteContribution(c.id)}
                        className="p-1 text-text-muted hover:text-danger rounded hover:bg-danger/10 transition-colors cursor-pointer"
                        title="Excluir contribuição"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
