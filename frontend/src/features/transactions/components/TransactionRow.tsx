import { Transaction, Category, TransactionType } from '../types';
import { Account } from '../../accounts/types';
import { Badge } from '../../../components/ui/Badge';
import { MoneyValue } from '../../../components/ui/MoneyValue';
import { Edit3, Trash2, Layers, RefreshCw } from 'lucide-react';
import { cn } from '../../../lib/cn';

interface TransactionRowProps {
  transaction: Transaction;
  accounts: Account[];
  categories: Category[];
  user: { id: string; name: string } | null;
  isCouple: boolean;
  partnerName: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
}

export function TransactionRow({
  transaction,
  accounts,
  categories,
  user,
  isCouple,
  partnerName,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
}: TransactionRowProps) {
  const acc = accounts.find(a => a.id === transaction.accountId);
  const cat = categories.find(c => c.id === transaction.categoryId);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const isOwner = user ? transaction.userId === user.id : false;

  return (
    <>
      <tr
        onClick={onToggleExpand}
        className="hover:bg-bg-elevated/10 transition-colors group cursor-pointer select-none"
      >
        <td className="p-4 text-zinc-400">
          {formatDate(transaction.competenceDate || transaction.dueDate)}
        </td>
        <td className="p-4 font-medium text-white">
          <div className="flex items-center gap-2 flex-wrap">
            <span>{transaction.description}</span>
            {transaction.installmentGroupId && (
              <span title="Lançamento Parcelado"><Layers className="w-3.5 h-3.5 text-blue-400" /></span>
            )}
            {transaction.isRecurring && (
              <span title="Lançamento Recorrente"><RefreshCw className="w-3.5 h-3.5 text-emerald-400" /></span>
            )}
            <Badge status={transaction.status} className="text-[10px] px-1.5 py-0" />
          </div>
        </td>
        <td className="p-4 text-zinc-400">
          {cat ? cat.name : (user && transaction.userId !== user.id ? 'Categoria do Parceiro' : 'Sem Categoria')}
        </td>
        <td className="p-4 text-zinc-400">
          {acc ? acc.name : (user && transaction.userId !== user.id ? 'Conta do Parceiro' : 'Conta excluída')}
        </td>
        <td className="p-4 text-right">
          <MoneyValue amount={transaction.type === TransactionType.EXPENSE ? -transaction.amount : transaction.amount} />
        </td>
        {isCouple && (
          <td className="p-4">
            <span className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded border select-none",
              isOwner
                ? "bg-violet-500/10 border-violet-500/20 text-violet-300"
                : "bg-pink-500/10 border-pink-500/20 text-pink-300"
            )}>
              {isOwner ? 'Você' : partnerName}
            </span>
          </td>
        )}
        <td className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150">
            {isOwner ? (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(transaction); }}
                  className="p-1 hover:bg-bg-elevated rounded-lg text-zinc-400 hover:text-white transition-colors"
                  title="Editar"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(transaction); }}
                  className="p-1 hover:bg-bg-elevated rounded-lg text-zinc-400 hover:text-red-400 transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <span className="text-xs text-zinc-550 italic select-none" title="Você não pode alterar transações criadas pelo parceiro">Somente leitura</span>
            )}
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-bg-elevated/20 border-b border-zinc-800/40">
          <td colSpan={isCouple ? 7 : 6} className="p-4 text-xs text-zinc-400">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-2">
              <div>
                <span className="font-semibold text-zinc-300">Vencimento:</span>{' '}
                <span className="text-zinc-200">{formatDate(transaction.dueDate)}</span>
              </div>
              <div>
                <span className="font-semibold text-zinc-300">Pagamento:</span>{' '}
                <span className="text-zinc-200">{transaction.paymentDate ? formatDate(transaction.paymentDate) : 'Pendente / Não pago'}</span>
              </div>
              <div>
                <span className="font-semibold text-zinc-300">Visibilidade:</span>{' '}
                <span className="text-zinc-200">
                  {transaction.visibility === 'SHARED' ? 'Compartilhado (Casal)' : 'Pessoal (Privado)'}
                </span>
              </div>
            </div>
            {transaction.recurrenceRule && (
              <div className="text-zinc-400 mt-2 text-[11px]">
                <span className="font-semibold text-zinc-300">Regra de recorrência:</span> {transaction.recurrenceRule === 'MONTHLY' ? 'Mensal' : transaction.recurrenceRule}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
