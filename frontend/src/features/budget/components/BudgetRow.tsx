import { ChevronRight, Check, X, Edit2, Lock } from 'lucide-react';
import { cn } from '../../../lib/cn';
import { ProgressBar } from '../../../components/ui/ProgressBar';

interface BudgetRowProps {
  categoryId?: string;
  categoryName: string;
  plannedAmount: number;
  realizedAmount: number;
  userId?: string | null;
  parentCategoryId: string | null;
  isEditing: boolean;
  isEditable: boolean;
  isCollapsed: boolean;
  hasChildren: boolean;
  onToggleCollapse: () => void;
  onStartEditing: () => void;
  onSave: (val: number) => Promise<void>;
  onCancelEditing: () => void;
  editValue: string;
  onEditValueChange: (val: string) => void;
  saveError: string | null;
  formatCurrency: (val: number) => string;
  isCouple: boolean;
  partnerName: string;
  user: {
    id: string;
    name?: string;
    currency?: string;
  };
}

export function BudgetRow({
  categoryName,
  plannedAmount,
  realizedAmount,
  userId,
  parentCategoryId,
  isEditing,
  isEditable,
  isCollapsed,
  hasChildren,
  onToggleCollapse,
  onStartEditing,
  onSave,
  onCancelEditing,
  editValue,
  onEditValueChange,
  saveError,
  formatCurrency,
  isCouple,
  partnerName,
  user,
}: BudgetRowProps) {
  const remaining = plannedAmount - realizedAmount;
  const isParent = !parentCategoryId;

  const handleSaveClick = () => {
    const num = parseFloat(editValue);
    onSave(num);
  };

  if (isParent) {
    return (
      <tr
        className={cn(
          'hover:bg-bg-elevated/20 transition-colors bg-bg-surface/30 border-b border-zinc-800/40',
          hasChildren && !isCollapsed && 'border-b-0 bg-bg-surface/20'
        )}
      >
        {/* Categoria */}
        <td className="px-6 py-4 font-semibold text-zinc-100 text-sm">
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="p-1 hover:bg-bg-elevated rounded text-zinc-400 hover:text-white transition-all flex items-center justify-center shrink-0 cursor-pointer"
              >
                <ChevronRight
                  className={cn(
                    'w-4 h-4 transition-transform duration-200',
                    !isCollapsed && 'transform rotate-90'
                  )}
                />
              </button>
            ) : (
              <div className="w-6 h-6 shrink-0" />
            )}
            <span>{categoryName}</span>
          </div>
        </td>

        {/* Orçado */}
        <td className="px-6 py-4 w-[180px]">
          {isEditing ? (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={editValue}
                onChange={(e) => onEditValueChange(e.target.value)}
                className="w-24 bg-zinc-950 border border-zinc-800 focus:border-brand outline-none rounded-lg px-2.5 py-1 text-sm font-medium"
                autoFocus
              />
              <button
                onClick={handleSaveClick}
                className="p-1 hover:bg-success/10 text-success rounded-lg transition-all cursor-pointer"
                title="Salvar"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={onCancelEditing}
                className="p-1 hover:bg-danger/10 text-zinc-400 hover:text-danger rounded-lg transition-all cursor-pointer"
                title="Cancelar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-zinc-100">{formatCurrency(plannedAmount)}</span>
              {isEditable ? (
                <button
                  onClick={onStartEditing}
                  className="p-1 text-zinc-400 hover:text-brand rounded-lg transition-all cursor-pointer"
                  title="Editar limite planejado"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span title={`Categoria de ${partnerName}`}>
                  <Lock className="w-3.5 h-3.5 text-zinc-500 cursor-help inline-block" />
                </span>
              )}
            </div>
          )}
          {isEditing && saveError && (
            <div className="text-xs text-danger mt-1">{saveError}</div>
          )}
        </td>

        {/* Gasto */}
        <td className="px-6 py-4 font-semibold text-zinc-300 w-[140px]">
          {formatCurrency(realizedAmount)}
        </td>

        {/* Restante */}
        <td className="px-6 py-4 w-[140px]">
          <span
            className={cn(
              'font-medium tabular-nums text-sm',
              remaining < 0 ? 'text-danger font-semibold' : 'text-zinc-400'
            )}
          >
            {formatCurrency(remaining)}
          </span>
        </td>

        {/* Progresso */}
        <td className="px-6 py-4">
          <ProgressBar value={realizedAmount} max={plannedAmount} className="w-56" />
        </td>

        {/* Membro */}
        {isCouple && (
          <td className="px-6 py-4">
            {userId ? (
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs uppercase border select-none shrink-0',
                    userId === user.id
                      ? 'bg-brand/10 border-brand/30 text-brand'
                      : 'bg-pink-500/10 border-pink-500/30 text-pink-400'
                  )}
                >
                  {userId === user.id
                    ? user.name?.charAt(0) || 'U'
                    : partnerName.charAt(0) || 'P'}
                </div>
                <span className="text-xs font-medium text-zinc-300 truncate max-w-[80px]">
                  {userId === user.id ? 'Você' : partnerName.split(' ')[0]}
                </span>
              </div>
            ) : (
              <span className="text-xs text-text-muted">—</span>
            )}
          </td>
        )}
      </tr>
    );
  }

  // Subcategory
  return (
    <tr className="hover:bg-bg-elevated/10 transition-colors subcategory-animate border-b-0">
      {/* Categoria */}
      <td className="px-6 py-3 pl-12 text-sm font-normal text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-700/40 shrink-0"></span>
          <span>{categoryName}</span>
        </div>
      </td>

      {/* Orçado */}
      <td className="px-6 py-3 text-sm w-[180px]">
        {isEditing ? (
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              value={editValue}
              onChange={(e) => onEditValueChange(e.target.value)}
              className="w-24 bg-zinc-950 border border-zinc-800 focus:border-brand outline-none rounded-lg px-2.5 py-1 text-sm font-medium"
              autoFocus
            />
            <button
              onClick={handleSaveClick}
              className="p-1 hover:bg-success/10 text-success rounded-lg transition-all cursor-pointer"
              title="Salvar"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={onCancelEditing}
              className="p-1 hover:bg-danger/10 text-zinc-400 hover:text-danger rounded-lg transition-all cursor-pointer"
              title="Cancelar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-300">{formatCurrency(plannedAmount)}</span>
            {isEditable ? (
              <button
                onClick={onStartEditing}
                className="p-1 text-zinc-400 hover:text-brand rounded-lg transition-all cursor-pointer"
                title="Editar limite planejado"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            ) : (
              <span title={`Categoria de ${partnerName}`}>
                <Lock className="w-3 h-3 text-zinc-500 cursor-help inline-block" />
              </span>
            )}
          </div>
        )}
        {isEditing && saveError && <div className="text-xs text-danger mt-1">{saveError}</div>}
      </td>

      {/* Gasto */}
      <td className="px-6 py-3 text-sm text-zinc-400 w-[140px]">{formatCurrency(realizedAmount)}</td>

      {/* Restante */}
      <td className="px-6 py-3 text-sm w-[140px]">
        <span
          className={cn(
            'font-medium tabular-nums text-sm',
            remaining < 0 ? 'text-danger font-semibold' : 'text-zinc-400'
          )}
        >
          {formatCurrency(remaining)}
        </span>
      </td>

      {/* Progresso */}
      <td className="px-6 py-3">
        <ProgressBar value={realizedAmount} max={plannedAmount} className="w-56" />
      </td>

      {/* Membro */}
      {isCouple && (
        <td className="px-6 py-3 text-sm">
          {userId ? (
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs uppercase border select-none shrink-0',
                  userId === user.id
                    ? 'bg-brand/10 border-brand/30 text-brand'
                    : 'bg-pink-500/10 border-pink-500/30 text-pink-400'
                )}
              >
                {userId === user.id
                  ? user.name?.charAt(0) || 'U'
                  : partnerName.charAt(0) || 'P'}
              </div>
              <span className="text-xs font-medium text-zinc-300 truncate max-w-[80px]">
                {userId === user.id ? 'Você' : partnerName.split(' ')[0]}
              </span>
            </div>
          ) : (
            <span className="text-xs text-text-muted">—</span>
          )}
        </td>
      )}
    </tr>
  );
}
