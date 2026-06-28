import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="mb-4 rounded-2xl bg-zinc-800/50 p-4 text-zinc-500">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-zinc-300">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-zinc-500 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
