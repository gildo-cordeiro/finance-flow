import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/cn';

type SectionLabelProps = HTMLAttributes<HTMLSpanElement>;

export const SectionLabel = forwardRef<HTMLSpanElement, SectionLabelProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'text-label-xs text-text-muted uppercase tracking-widest',
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

SectionLabel.displayName = 'SectionLabel';
