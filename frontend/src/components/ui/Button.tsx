import { cn } from '../../lib/cn';
import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900',
        // Variantes
        variant === 'primary'   && 'bg-violet-600 text-white hover:bg-violet-500 focus:ring-violet-500 shadow-lg shadow-violet-500/25',
        variant === 'secondary' && 'bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700 focus:ring-zinc-600',
        variant === 'ghost'     && 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 focus:ring-zinc-700',
        variant === 'danger'    && 'bg-red-600/10 text-red-400 border border-red-500/20 hover:bg-red-600/20 focus:ring-red-500',
        // Tamanhos
        size === 'sm' && 'px-3 py-1.5 text-xs',
        size === 'md' && 'px-4 py-2 text-sm',
        size === 'lg' && 'px-6 py-3 text-base',
        // Estados
        (disabled || loading) && 'cursor-not-allowed opacity-50',
        className
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      )}
      {children}
    </button>
  );
}
