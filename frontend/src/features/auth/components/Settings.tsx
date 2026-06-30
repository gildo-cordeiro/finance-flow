import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  User,
  ArrowLeft,
  ShieldAlert,
  Tag,
  Heart,
  RefreshCw
} from 'lucide-react';
import { cn } from '../../../lib/cn';
import { ProfileTab } from './settings/ProfileTab';
import { CategoriesTab } from './settings/CategoriesTab';
import { CoupleTab } from './settings/CoupleTab';
import { OpenFinanceTab } from './settings/OpenFinanceTab';
import { DangerZoneTab } from './settings/DangerZoneTab';

export function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<'profile' | 'categories' | 'couple' | 'open-finance' | 'danger-zone'>('profile');

  return (
    <div className="gradient-bg min-h-screen text-white flex flex-col">
      {/* Upper Navigation Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-zinc-800/80">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Painel
        </button>
        <div className="flex items-center gap-3">
          <span className="text-zinc-500 text-xs select-none">ID do Usuário: {user?.id}</span>
        </div>
      </header>

      {/* Main Settings Page Container */}
      <div className="max-w-7xl mx-auto w-full px-6 py-8 flex-1 flex flex-col md:flex-row gap-8">
        
        {/* Left Vertical Navigation Menu (Tabs) - Fixed 200px */}
        <aside className="w-full md:w-[220px] shrink-0 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 border-b md:border-b-0 md:border-r border-zinc-800/80 pr-0 md:pr-4 select-none scrollbar-thin scrollbar-thumb-zinc-800">
          <button
            onClick={() => setActiveSection('profile')}
            className={cn(
              "w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 whitespace-nowrap md:whitespace-normal border-l-2 md:border-l-4",
              activeSection === 'profile'
                ? "bg-violet-500/10 border-violet-500 text-violet-400 font-bold"
                : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
            )}
          >
            <User className="w-4.5 h-4.5" />
            <span>Perfil</span>
          </button>
          
          <button
            onClick={() => setActiveSection('categories')}
            className={cn(
              "w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 whitespace-nowrap md:whitespace-normal border-l-2 md:border-l-4",
              activeSection === 'categories'
                ? "bg-violet-500/10 border-violet-500 text-violet-400 font-bold"
                : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
            )}
          >
            <Tag className="w-4.5 h-4.5" />
            <span>Categorias</span>
          </button>

          <button
            onClick={() => setActiveSection('couple')}
            className={cn(
              "w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 whitespace-nowrap md:whitespace-normal border-l-2 md:border-l-4",
              activeSection === 'couple'
                ? "bg-violet-500/10 border-violet-500 text-violet-400 font-bold"
                : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
            )}
          >
            <Heart className="w-4.5 h-4.5" />
            <span>Casal</span>
          </button>

          <button
            onClick={() => setActiveSection('open-finance')}
            className={cn(
              "w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 whitespace-nowrap md:whitespace-normal border-l-2 md:border-l-4",
              activeSection === 'open-finance'
                ? "bg-violet-500/10 border-violet-500 text-violet-400 font-bold"
                : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
            )}
          >
            <RefreshCw className="w-4.5 h-4.5 animate-spin-slow" />
            <span>Open Finance</span>
          </button>

          <button
            onClick={() => setActiveSection('danger-zone')}
            className={cn(
              "w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 whitespace-nowrap md:whitespace-normal border-l-2 md:border-l-4",
              activeSection === 'danger-zone'
                ? "bg-red-500/10 border-red-500 text-red-400 font-bold"
                : "border-transparent text-zinc-400 hover:text-red-455 hover:bg-zinc-850"
            )}
          >
            <ShieldAlert className="w-4.5 h-4.5" />
            <span>Zona de Perigo</span>
          </button>
        </aside>

        {/* Right Content Section - Scrollable and Flex */}
        <main className="flex-1 min-w-0 max-h-[85vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
          {activeSection === 'profile' && <ProfileTab />}
          {activeSection === 'categories' && <CategoriesTab />}
          {activeSection === 'couple' && <CoupleTab />}
          {activeSection === 'open-finance' && <OpenFinanceTab />}
          {activeSection === 'danger-zone' && <DangerZoneTab />}
        </main>
      </div>
    </div>
  );
}
