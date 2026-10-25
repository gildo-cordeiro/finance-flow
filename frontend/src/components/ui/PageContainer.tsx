import React from 'react';

export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <main className="max-w-[1200px] mx-auto px-6 py-8 animate-in fade-in-0 slide-in-from-bottom-1 duration-300 motion-reduce:animate-none">
      {children}
    </main>
  );
}
