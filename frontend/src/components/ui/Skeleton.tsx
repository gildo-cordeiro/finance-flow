import { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse rounded-xl bg-zinc-800/60', className)} {...props} />
  );
}

export function TransactionCardSkeleton() {
  return (
    <div className="bg-bg-surface border border-border-subtle rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-6 w-24" />
    </div>
  );
}

