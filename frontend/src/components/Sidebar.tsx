import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useView } from '../context/ViewContext';
import { useCouple } from '../features/couple/hooks/useCouple';
import { cn } from '../lib/cn';

import {
  LayoutDashboard,
  TrendingUp,
  DollarSign,
  LineChart,
  Wallet,
  Settings,
  LogOut,
  User,
  Heart,
  X,
  Target
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const { viewContext, setViewContext } = useView();
  const { coupleStatus } = useCouple();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setAvatar(localStorage.getItem(`avatar_${user.id}`));
    }

    const handleAvatarChange = () => {
      if (user) {
        setAvatar(localStorage.getItem(`avatar_${user.id}`));
      }
    };

    window.addEventListener('avatar-changed', handleAvatarChange);
    return () => {
      window.removeEventListener('avatar-changed', handleAvatarChange);
    };
  }, [user]);

  if (!user) return null;

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Orçamento', path: '/budget', icon: TrendingUp },
    { label: 'Transações', path: '/transactions', icon: DollarSign },
    { label: 'Fluxo de Caixa', path: '/cash-flow', icon: LineChart },
    { label: 'Contas', path: '/accounts', icon: Wallet },
    { label: 'Objetivos', path: '/goals', icon: Target },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  const isSettingsActive = pathname.startsWith('/settings') || pathname.startsWith('/profile');

  return (
    <>
      {/* Backdrop overlay for mobile drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex w-[220px] flex-col justify-between bg-bg-surface border-r border-white/[0.06] transition-transform duration-300 ease-in-out md:translate-x-0 h-screen",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Top Header / Logo */}
        <div className="pt-6 px-5 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand rounded-xl flex items-center justify-center shadow-lg shadow-brand/20 shrink-0">
              <span className="text-sm font-bold text-white tracking-wider">FF</span>
            </div>
            <span className="font-semibold text-white tracking-tight">FinanceFlow</span>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="md:hidden p-1 text-text-muted hover:text-white rounded-lg hover:bg-bg-elevated transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border-l-[3px]",
                  active
                    ? "bg-brand/15 border-brand text-brand"
                    : "border-transparent text-text-secondary hover:text-text-primary hover:bg-white/5"
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Divider */}
          <div className="my-4 border-t border-white/[0.06]" />

          {/* Settings Item */}
          <button
            onClick={() => handleNavigation('/settings')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border-l-[3px]",
              isSettingsActive
                ? "bg-brand/15 border-brand text-brand"
                : "border-transparent text-text-secondary hover:text-text-primary hover:bg-white/5"
            )}
          >
            <Settings className="w-5 h-5 shrink-0" />
            <span>Configurações</span>
          </button>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 bg-bg-surface border-t border-white/[0.06]">
          {/* Couple view context toggle - Only rendered if coupleStatus is ACTIVE */}
          {coupleStatus.status === 'ACTIVE' && (
            <div className="flex items-center bg-bg-base border border-border-subtle p-1 rounded-xl shadow-lg w-full mb-4">
              <button
                onClick={() => setViewContext('PERSONAL')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  viewContext === 'PERSONAL'
                    ? "bg-brand text-white shadow-md shadow-brand/15"
                    : "text-text-muted hover:text-text-secondary"
                )}
              >
                <User className="w-3.5 h-3.5" />
                Pessoal
              </button>
              <button
                onClick={() => setViewContext('COUPLE')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  viewContext === 'COUPLE'
                    ? "bg-brand text-white shadow-md shadow-brand/15"
                    : "text-text-muted hover:text-text-secondary"
                )}
              >
                <Heart className="w-3.5 h-3.5" />
                Casal
              </button>
            </div>
          )}

          {/* User Info & Logout */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-brand/20 border border-brand/30 flex items-center justify-center text-sm font-semibold text-brand shrink-0">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>

              <div className="flex flex-col min-w-0 overflow-hidden">
                <span className="text-sm font-medium text-text-primary truncate">{user.name}</span>
                <span className="text-xs text-text-muted truncate">{user.email}</span>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-text-muted hover:text-danger rounded-lg hover:bg-danger/5 transition-colors shrink-0"
              title="Sair"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
