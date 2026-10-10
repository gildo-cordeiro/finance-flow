import { cn } from '../../lib/cn';
import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isCurrency?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, isCurrency, className, ...props }, ref) => {
    let displayValue = props.value;
    let defaultDisplayValue = props.defaultValue;

    if (isCurrency) {
      if (displayValue !== undefined && displayValue !== null && displayValue !== '') {
        const num = typeof displayValue === 'number' ? displayValue : parseFloat(displayValue.toString()) || 0;
        displayValue = new Intl.NumberFormat('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(num);
      }
      if (defaultDisplayValue !== undefined && defaultDisplayValue !== null && defaultDisplayValue !== '') {
        const num = typeof defaultDisplayValue === 'number' ? defaultDisplayValue : parseFloat(defaultDisplayValue.toString()) || 0;
        defaultDisplayValue = new Intl.NumberFormat('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(num);
      }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isCurrency) {
        const raw = e.target.value.replace(/\D/g, '');
        if (!raw) {
          e.target.value = '';
          if (props.onChange) {
            props.onChange(e);
          }
          return;
        }
        
        const numValue = parseFloat(raw) / 100;
        const formatted = new Intl.NumberFormat('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(numValue);

        // Temporarily set the raw number string value so react-hook-form/controlled state receives the clean float value
        e.target.value = numValue.toString();
        if (props.onChange) {
          props.onChange(e);
        }
        // Visually restore the formatted currency value in the input field
        e.target.value = formatted;
      } else {
        if (props.onChange) {
          props.onChange(e);
        }
      }
    };

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-[13px] font-semibold text-text-label">
            {label}
          </label>
        )}
        <div className="relative w-full">
          {leftIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted flex items-center justify-center pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            type={isCurrency ? 'text' : props.type}
            inputMode={isCurrency ? 'numeric' : props.inputMode}
            className={cn(
              'w-full rounded-xl bg-bg-base/60 border px-3.5 py-2.5 text-sm text-text-primary',
              'placeholder:text-text-muted transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              leftIcon && 'pl-11',
              rightIcon && 'pr-11',
              error
                ? 'border-danger/50 focus:border-danger focus:ring-danger/20'
                : 'border-border-subtle focus:border-brand focus:ring-brand/20',
              className
            )}
            {...props}
            value={displayValue}
            defaultValue={defaultDisplayValue}
            onChange={handleChange}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>
        {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
