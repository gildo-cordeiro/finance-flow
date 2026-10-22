import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/cn';

type SectionLabelProps = HTMLAttributes<HTMLSpanElement>;

export const SectionLabel = forwardRef<HTMLSpanElement, SectionLabelProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'text-[13px] font-semibold text-text-label',
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
