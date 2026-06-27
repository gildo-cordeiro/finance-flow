import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCouple } from '../features/couple/hooks/useCouple';

type ViewContextType = {
  viewContext: 'PERSONAL' | 'COUPLE';
  setViewContext: (context: 'PERSONAL' | 'COUPLE') => void;
};

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export function ViewProvider({ children }: { children: React.ReactNode }) {
  const [viewContext, setViewContextState] = useState<'PERSONAL' | 'COUPLE'>(() => {
    return (localStorage.getItem('view_context') as 'PERSONAL' | 'COUPLE') || 'PERSONAL';
  });

  const queryClient = useQueryClient();

  const setViewContext = (context: 'PERSONAL' | 'COUPLE') => {
    setViewContextState(context);
    localStorage.setItem('view_context', context);
    queryClient.invalidateQueries();
  };

  const { coupleStatus } = useCouple();
  useEffect(() => {
    if (coupleStatus && coupleStatus.status !== 'ACTIVE' && viewContext === 'COUPLE') {
      setViewContext('PERSONAL');
    }
  }, [coupleStatus, viewContext]);

  return (
    <ViewContext.Provider value={{ viewContext, setViewContext }}>
      <div className={viewContext === 'COUPLE' ? 'couple-mode-active' : ''}>
        {children}
      </div>
    </ViewContext.Provider>
  );
}

export function useView() {
  const context = useContext(ViewContext);
  if (!context) {
    throw new Error('useView must be used within a ViewProvider');
  }
  return context;
}
