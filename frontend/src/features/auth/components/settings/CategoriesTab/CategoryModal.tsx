import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Coffee,
  Home,
  Car,
  Smile,
  Heart,
  BookOpen,
  Tag,
  ShoppingBag,
  Gift,
  Wallet,
  Activity,
  X,
  Info,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { Input } from '../../../../../components/ui/Input';
import { Button } from '../../../../../components/ui/Button';
import { cn } from '../../../../../lib/cn';
import type { Category } from '../../../../transactions/types';

export const CATEGORY_ICONS = [
  { name: 'TrendingUp', icon: TrendingUp },
  { name: 'Coffee', icon: Coffee },
  { name: 'Home', icon: Home },
  { name: 'Car', icon: Car },
  { name: 'Smile', icon: Smile },
  { name: 'Heart', icon: Heart },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Tag', icon: Tag },
  { name: 'ShoppingBag', icon: ShoppingBag },
  { name: 'Gift', icon: Gift },
  { name: 'Wallet', icon: Wallet },
  { name: 'Activity', icon: Activity },
] as const;

export const CATEGORY_COLORS = [
  { name: 'emerald', hex: '#10b981', classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { name: 'blue', hex: '#3b82f6', classes: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { name: 'indigo', hex: '#6366f1', classes: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  { name: 'violet', hex: '#8b5cf6', classes: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  { name: 'pink', hex: '#ec4899', classes: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
  { name: 'amber', hex: '#f59e0b', classes: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { name: 'red', hex: '#ef4444', classes: 'bg-red-500/10 text-red-400 border-red-500/20' },
  { name: 'zinc', hex: '#71717a', classes: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
] as const;

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  selectedParentId: string | null;
  editingCategory: Category | null;
  onSave: (name: string, icon: string, color: string) => Promise<void>;
  isSaving: boolean;
  error: string | null;
  initialIcon?: string;
  initialColor?: string;
}

export function CategoryModal({
  isOpen,
  onClose,
  mode,
  selectedParentId,
  editingCategory,
  onSave,
  isSaving,
  error,
  initialIcon = 'Tag',
  initialColor = 'zinc',
}: CategoryModalProps) {
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('Tag');
  const [categoryColor, setCategoryColor] = useState('zinc');

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && editingCategory) {
        setCategoryName(editingCategory.name);
      } else {
        setCategoryName('');
      }
      setCategoryIcon(initialIcon);
      setCategoryColor(initialColor);
    }
  }, [isOpen, mode, editingCategory, initialIcon, initialColor]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(categoryName, categoryIcon, categoryColor);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-bg-surface border border-border-subtle w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <h3 className="text-lg font-bold text-white">
            {mode === 'create'
              ? selectedParentId
                ? 'Nova Subcategoria'
                : 'Nova Categoria Pai'
              : !editingCategory?.userId
              ? 'Editar Aparência (Categoria Padrão)'
              : 'Editar Categoria'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-bg-elevated rounded-lg text-text-muted hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!editingCategory?.userId && mode === 'edit' && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs rounded-xl flex items-start gap-2.5">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              Esta é uma categoria padrão do sistema. Você pode alterar seu ícone e cor, mas seu nome
              não pode ser modificado.
            </span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-danger/10 border border-danger/20 text-danger text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            label="Nome da Categoria"
            placeholder="Ex: Streaming, Padaria..."
            required
            value={categoryName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCategoryName(e.target.value)}
            disabled={mode === 'edit' && !editingCategory?.userId}
            hint={
              mode === 'edit' && !editingCategory?.userId
                ? 'Nome fixado para relatórios nativos.'
                : undefined
            }
          />

          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block">
              Ícone Visual
            </label>
            <div className="grid grid-cols-6 gap-2 p-3 bg-bg-base/40 border border-border-subtle rounded-xl max-h-[140px] overflow-y-auto pr-1 scrollbar-thin">
              {CATEGORY_ICONS.map((item) => {
                const IconComp = item.icon;
                const isSelected = categoryIcon === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setCategoryIcon(item.name)}
                    className={cn(
                      'p-2 rounded-lg border flex items-center justify-center transition-all hover:bg-bg-elevated hover:text-text-primary cursor-pointer',
                      isSelected ? 'border-brand bg-brand/10 text-brand' : 'border-transparent text-text-muted'
                    )}
                  >
                    <IconComp className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block">
              Cor da Categoria
            </label>
            <div className="flex flex-wrap gap-2.5 p-3 bg-bg-base/40 border border-border-subtle rounded-xl">
              {CATEGORY_COLORS.map((color) => {
                const isSelected = categoryColor === color.name;
                return (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setCategoryColor(color.name)}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-all border border-zinc-900 shadow hover:scale-110 active:scale-95 cursor-pointer"
                    style={{ backgroundColor: color.hex }}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-zinc-950 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="bg-transparent hover:bg-bg-elevated text-text-secondary hover:text-text-primary font-medium rounded-xl py-2 px-4 transition-all text-sm cursor-pointer"
            >
              Cancelar
            </button>
            <Button type="submit" loading={isSaving}>
              Salvar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
