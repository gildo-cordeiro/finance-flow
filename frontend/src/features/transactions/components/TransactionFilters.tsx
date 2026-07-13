import React from 'react';
import { Card } from '../../../components/ui/Card';
import { X } from 'lucide-react';
import { Account } from '../../accounts/types';
import { Category } from '../types';
import { cn } from '../../../lib/cn';

interface FilterChip {
  id: string;
  label: string;
  onClear: () => void;
}

interface TransactionFiltersProps {
  filterAccountId: string;
  setFilterAccountId: (val: string) => void;
  filterCategoryId: string;
  setFilterCategoryId: (val: string) => void;
  filterStatus: 'ALL' | 'PAID' | 'PLANNED' | 'PENDING' | 'OVERDUE';
  setFilterStatus: (val: 'ALL' | 'PAID' | 'PLANNED' | 'PENDING' | 'OVERDUE') => void;
  filterMember: 'ALL' | 'OWN' | 'PARTNER';
  setFilterMember: (val: 'ALL' | 'OWN' | 'PARTNER') => void;
  accounts: Account[];
  rootCategories: Category[];
  getSubcategories: (parentId: string) => Category[];
  isCouple: boolean;
  partnerName: string;
  activeChips: FilterChip[];
  handleClearAllFilters: () => void;
}

export function TransactionFilters({
  filterAccountId,
  setFilterAccountId,
  filterCategoryId,
  setFilterCategoryId,
  filterStatus,
  setFilterStatus,
  filterMember,
  setFilterMember,
  accounts,
  rootCategories,
  getSubcategories,
  isCouple,
  partnerName,
  activeChips,
  handleClearAllFilters,
}: TransactionFiltersProps) {
  return (
    <Card className="p-6 space-y-4">
      <div className={cn(
        "grid grid-cols-1 gap-4 items-end",
        isCouple ? "sm:grid-cols-4" : "sm:grid-cols-3"
      )}>
        <div>
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">Conta</label>
          <select
            value={filterAccountId}
            onChange={(e) => setFilterAccountId(e.target.value)}
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500 text-zinc-100"
          >
            <option value="">Todas as contas</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.bank})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">Categoria</label>
          <select
            value={filterCategoryId}
            onChange={(e) => setFilterCategoryId(e.target.value)}
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500 text-zinc-100"
          >
            <option value="">Todas as categorias</option>
            {rootCategories.map(parent => (
              <React.Fragment key={parent.id}>
                <option value={parent.id} className="font-bold text-violet-400">{parent.name}</option>
                {getSubcategories(parent.id).map(sub => (
                  <option key={sub.id} value={sub.id}>&nbsp;&nbsp;&nbsp;&nbsp;{sub.name}</option>
                ))}
              </React.Fragment>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'ALL' | 'PAID' | 'PLANNED' | 'PENDING' | 'OVERDUE')}
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500 text-zinc-100"
          >
            <option value="ALL">Todos os status</option>
            <option value="PAID">Pago</option>
            <option value="PLANNED">Planejado</option>
            <option value="PENDING">Pendente</option>
            <option value="OVERDUE">Atrasado</option>
          </select>
        </div>

        {isCouple && (
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">Membro</label>
            <select
              value={filterMember}
              onChange={(e) => setFilterMember(e.target.value as 'ALL' | 'OWN' | 'PARTNER')}
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500 text-zinc-100"
            >
              <option value="ALL">Todos os membros</option>
              <option value="OWN">Você</option>
              <option value="PARTNER">{partnerName}</option>
            </select>
          </div>
        )}
      </div>

      {/* Active Filter Chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-zinc-800/40">
          <span className="text-xs text-zinc-400 font-medium mr-1">Filtros ativos:</span>
          {activeChips.map(chip => (
            <div
              key={chip.id}
              className="bg-bg-elevated/40 border border-border-subtle rounded-lg px-2.5 py-1 flex items-center gap-2 text-xs text-zinc-300"
            >
              <span>{chip.label}</span>
              <button
                onClick={chip.onClear}
                className="text-zinc-550 hover:text-red-400 transition-colors p-0.5 rounded"
                title="Remover filtro"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button
            onClick={handleClearAllFilters}
            className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors ml-auto"
          >
            Limpar todos
          </button>
        </div>
      )}
    </Card>
  );
}
