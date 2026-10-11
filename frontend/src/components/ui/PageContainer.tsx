import React from 'react';

export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <main className="max-w-[1200px] mx-auto px-6 py-8">
      {children}
    </main>
  );
}
