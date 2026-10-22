import {
  forwardRef,
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
} from 'react';
import { SectionLabel } from './SectionLabel';
import { maskCurrency } from '../../utils/formatters';
import { cn } from '../../lib/cn';

export interface CurrencyInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'defaultValue'> {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  label?: string;
  error?: string;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      id,
      value,
      defaultValue,
      onChange,
      autoFocus,
      label = 'Valor',
      error,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    const innerRef = useRef<HTMLInputElement | null>(null);

    const setRefs = useCallback(
      (node: HTMLInputElement | null) => {
        innerRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );

    const isControlled = value !== undefined;
    const [internalCents, setInternalCents] = useState<number>(() => {
      if (typeof defaultValue === 'number' && !isNaN(defaultValue)) {
        return Math.round(defaultValue * 100);
      }
      return 0;
    });

    const currentCents = isControlled
      ? typeof value === 'number' && !isNaN(value)
        ? Math.round(value * 100)
        : 0
      : internalCents;

    const displayValue = maskCurrency(currentCents);

    // Keep cursor positioned at end during user typing and value formatting
    useLayoutEffect(() => {
      if (
        innerRef.current &&
        typeof document !== 'undefined' &&
        document.activeElement === innerRef.current
      ) {
        const len = innerRef.current.value.length;
        innerRef.current.setSelectionRange(len, len);
      }
    }, [displayValue]);

    useLayoutEffect(() => {
      if (autoFocus && innerRef.current) {
        innerRef.current.focus();
        const len = innerRef.current.value.length;
        innerRef.current.setSelectionRange(len, len);
      }
    }, [autoFocus]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const rawDigits = e.target.value.replace(/\D/g, '');
      if (!rawDigits) {
        if (!isControlled) setInternalCents(0);
        onChange?.(0);
        return;
      }
      const parsedCents = parseInt(rawDigits.slice(0, 12), 10);
      if (!isControlled) setInternalCents(parsedCents);
      const reais = parsedCents / 100;
      onChange?.(reais);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        [
          'Backspace',
          'Delete',
          'Tab',
          'Enter',
          'Escape',
          'ArrowLeft',
          'ArrowRight',
          'ArrowUp',
          'ArrowDown',
          'Home',
          'End',
        ].includes(e.key)
      ) {
        return;
      }

      // Reject non-digit characters
      if (!/^\d$/.test(e.key)) {
        e.preventDefault();
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      const target = e.target;
      const len = target.value.length;
      target.setSelectionRange(len, len);
      props.onFocus?.(e);
    };

    const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
      const target = e.currentTarget;
      const len = target.value.length;
      target.setSelectionRange(len, len);
      props.onClick?.(e);
    };

    return (
      <div className="flex flex-col items-center w-full">
        <label htmlFor={inputId} className="cursor-pointer mb-1 text-center">
          <SectionLabel>{label}</SectionLabel>
        </label>
        <input
          ref={setRefs}
          id={inputId}
          type="text"
          inputMode="numeric"
          autoFocus={autoFocus}
          disabled={disabled}
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onClick={handleClick}
          className={cn(
            'w-full text-center text-[44px] font-extrabold text-text-primary bg-transparent border-none outline-none focus:outline-none focus:ring-0 tabular-nums',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-danger mt-1 text-center">{error}</p>}
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
