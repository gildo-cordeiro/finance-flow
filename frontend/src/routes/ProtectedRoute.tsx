import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Menu } from 'lucide-react';

export function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  console.log('[ProtectedRoute] rendered. isAuthenticated:', isAuthenticated, 'isInitializing:', isInitializing);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-violet-500"></div>
          <span className="text-zinc-400 font-medium">Carregando...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('[ProtectedRoute] User not authenticated. Redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-bg-base text-white flex flex-col">
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-bg-surface border-b border-white/[0.06] sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold text-white tracking-wider">FF</span>
          </div>
          <span className="font-semibold text-white tracking-tight">FinanceFlow</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-text-secondary hover:text-white rounded-lg hover:bg-bg-elevated transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <div className="flex flex-1 flex-col md:flex-row">
        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Main content */}
        <main className="flex-1 min-h-screen md:pl-[220px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
