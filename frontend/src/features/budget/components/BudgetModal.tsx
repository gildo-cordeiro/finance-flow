import React, { useState } from 'react';
import { Tag, X, AlertTriangle } from 'lucide-react';
import { Input } from '../../../components/ui/Input';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (categoryId: string, amount: number) => Promise<void>;
  categoryOptions: Array<{ id: string; name: string }>;
}

export function BudgetModal({ isOpen, onClose, onSave, categoryOptions }: BudgetModalProps) {
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!categoryId) {
      setError('Selecione uma categoria');
      return;
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 0) {
      setError('Valor inválido');
      return;
    }

    setIsSaving(false);
    try {
      setIsSaving(true);
      await onSave(categoryId, amt);
      setCategoryId('');
      setAmount('');
      onClose();
    } catch {
      setError('Erro ao salvar orçamento');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="auth-card w-full max-w-md p-6 space-y-6 animate-in fade-in zoom-in-95 duration-150 text-white">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Tag className="w-5 h-5 text-brand" />
            <span>Novo Orçamento</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-text-label">
              Categoria
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-xl bg-zinc-800/50 border border-zinc-700/50 px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-brand focus:ring-brand/20 transition-all"
            >
              <option value="">Selecione uma categoria...</option>
              {categoryOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            isCurrency={true}
            label="Valor Planejado (R$)"
            placeholder="0,00"
            value={amount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
          />

          <div className="flex justify-end gap-3 border-t border-zinc-800 pt-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-sm font-semibold bg-brand hover:bg-brand-hover text-white rounded-xl shadow-lg shadow-brand/25 transition-all cursor-pointer disabled:opacity-55"
            >
              {isSaving ? 'Salvando...' : 'Salvar Orçamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
