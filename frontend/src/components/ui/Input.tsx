import { cn } from '../../lib/cn';
import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-xs font-semibold text-zinc-350 uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="relative w-full">
        {leftIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 flex items-center justify-center pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full rounded-xl bg-zinc-900/60 border px-3.5 py-2.5 text-sm text-zinc-100',
            'placeholder:text-zinc-650 transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            leftIcon && 'pl-11',
            rightIcon && 'pr-11',
            error
              ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
              : 'border-zinc-800 focus:border-violet-500 focus:ring-violet-500/20',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 flex items-center justify-center">
            {rightIcon}
          </div>
        )}
      </div>
      {hint && !error && <p className="text-xs text-zinc-500">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
);

Input.displayName = 'Input';
