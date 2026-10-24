import type { KeyboardEvent, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface TabItem<T extends string> {
  value: T;
  label: string;
}

interface TabsProps<T extends string> {
  label: string;
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  idPrefix: string;
  children: ReactNode;
}

const tabId = (prefix: string, value: string) => `${prefix}-tab-${value}`;
const panelId = (prefix: string, value: string) => `${prefix}-panel-${value}`;

export function Tabs<T extends string>({ label, items, value, onChange, idPrefix, children }: TabsProps<T>) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const index = items.findIndex((item) => item.value === value);
    const next = items[(index + step + items.length) % items.length];
    onChange(next.value);
    document.getElementById(tabId(idPrefix, next.value))?.focus();
  };

  return (
    <>
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="mb-6 flex gap-6 overflow-x-auto border-b border-border-subtle"
      >
        {items.map((item) => {
          const selected = item.value === value;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              id={tabId(idPrefix, item.value)}
              aria-selected={selected}
              aria-controls={selected ? panelId(idPrefix, item.value) : undefined}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(item.value)}
              className={cn(
                '-mb-px whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                selected ? 'border-primary text-text-primary' : 'border-transparent text-text-muted hover:text-text-primary'
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={panelId(idPrefix, value)} aria-labelledby={tabId(idPrefix, value)}>
        {children}
      </div>
    </>
  );
}
