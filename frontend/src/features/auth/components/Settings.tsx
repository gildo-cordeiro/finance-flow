import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  User,
  ShieldAlert,
  Tag,
  Heart,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../lib/cn';
import { ProfileTab } from './settings/ProfileTab';
import { CategoriesTab } from './settings/CategoriesTab';
import { CoupleTab } from './settings/CoupleTab';
import { OpenFinanceTab } from './settings/OpenFinanceTab';
import { DangerZoneTab } from './settings/DangerZoneTab';
import { PageContainer } from '../../../components/ui/PageContainer';
import { PageHeader } from '../../../components/ui/PageHeader';

export function Settings() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<'profile' | 'categories' | 'couple' | 'open-finance' | 'danger-zone'>('profile');
  const [copied, setCopied] = useState(false);

  const handleCopyId = async () => {
    if (!user?.id) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(user.id);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Configurações"
        subtitle="Gerencie sua conta e preferências."
      />

      {/* Main Settings Page Container */}
      <div className="w-full flex-1 flex flex-col md:flex-row gap-8">
        
        {/* Left Vertical Navigation Menu (Tabs) - Fixed 200px */}
        <aside className="w-full md:w-[220px] shrink-0 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 border-b md:border-b-0 md:border-r border-zinc-800/80 pr-0 md:pr-4 select-none scrollbar-thin scrollbar-thumb-zinc-800">
          <button
            onClick={() => setActiveSection('profile')}
            className={cn(
              "w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 whitespace-nowrap md:whitespace-normal border-l-2 md:border-l-4",
              activeSection === 'profile'
                ? "bg-violet-500/10 border-violet-500 text-violet-400 font-bold"
                : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-bg-elevated"
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
                : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-bg-elevated"
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
                : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-bg-elevated"
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
                : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-bg-elevated"
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
                : "border-transparent text-zinc-400 hover:text-red-400 hover:bg-bg-elevated"
            )}
          >
            <ShieldAlert className="w-4.5 h-4.5" />
            <span>Zona de Perigo</span>
          </button>
        </aside>

        {/* Right Content Section */}
        <main className="flex-1 min-w-0">
          {activeSection === 'profile' && <ProfileTab />}
          {activeSection === 'categories' && <CategoriesTab />}
          {activeSection === 'couple' && <CoupleTab />}
          {activeSection === 'open-finance' && <OpenFinanceTab />}
          {activeSection === 'danger-zone' && <DangerZoneTab />}
        </main>
      </div>

      {/* Footer User ID */}
      <div className="mt-8 pt-6 border-t border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-text-muted">
        <span>ID do Usuário: {user?.id}</span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleCopyId}
          disabled={!user?.id}
          className="shrink-0"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copiado!' : 'Copiar'}</span>
        </Button>
      </div>
    </PageContainer>
  );
}
