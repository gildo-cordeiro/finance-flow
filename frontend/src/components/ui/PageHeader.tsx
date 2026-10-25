import React from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 mb-6 sm:mb-8">
      <div className="space-y-1">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="text-zinc-400 text-sm">{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
