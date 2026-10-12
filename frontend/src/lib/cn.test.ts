import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn utility', () => {
  it('should merge class names correctly', () => {
    expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
  });

  it('should resolve tailwind conflicts by taking the latter class', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('should ignore falsy, null and undefined values', () => {
    expect(cn('base', false && 'hidden', null, undefined, 'visible')).toBe('base visible');
  });

  it('should work seamlessly with class-variance-authority (cva)', async () => {
    const { cva } = await import('class-variance-authority');
    const buttonVariants = cva('base-btn', {
      variants: {
        intent: {
          primary: 'bg-primary text-primary-foreground',
          secondary: 'bg-secondary text-secondary-foreground',
        },
      },
      defaultVariants: {
        intent: 'primary',
      },
    });

    expect(cn(buttonVariants({ intent: 'primary' }), 'custom-class')).toBe(
      'base-btn bg-primary text-primary-foreground custom-class'
    );
  });
});
