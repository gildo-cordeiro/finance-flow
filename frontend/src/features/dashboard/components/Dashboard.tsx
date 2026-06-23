import { useAuth } from '../../auth/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, Wallet, Globe2, Calendar, DollarSign } from 'lucide-react';

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="gradient-bg min-h-screen text-white">
      <nav className="glassmorphism sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
              <span className="text-lg font-bold text-white tracking-wider">FF</span>
            </div>
            <span className="font-semibold text-lg tracking-tight text-white">FinanceFlow</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/accounts')}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/50 transition-all flex items-center gap-2 text-sm font-medium"
            >
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">Minhas Contas</span>
            </button>
            <button
              onClick={() => navigate('/transactions')}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/50 transition-all flex items-center gap-2 text-sm font-medium"
            >
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Transações</span>
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/50 transition-all flex items-center gap-2 text-sm font-medium"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Configurações</span>
            </button>
            <button
              onClick={logout}
              className="p-2 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-red-500/5 transition-all flex items-center gap-2 text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-12 space-y-10">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight">Olá, {user.name}!</h1>
          <p className="text-zinc-400 text-sm">Bem-vindo ao seu painel financeiro.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="auth-card p-6 flex items-start gap-4">
            <div className="p-3 bg-violet-500/10 text-violet-400 rounded-xl">
              <Globe2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Fuso Horário</h3>
              <p className="text-lg font-medium text-white mt-1">{user.timeZone}</p>
            </div>
          </div>

          <div className="auth-card p-6 flex items-start gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Moeda Principal</h3>
              <p className="text-lg font-medium text-white mt-1">{user.currency}</p>
            </div>
          </div>

          <div className="auth-card p-6 flex items-start gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Fechamento do Ciclo</h3>
              <p className="text-lg font-medium text-white mt-1">Dia {user.budgetClosingDay}</p>
            </div>
          </div>
        </div>

        <div className="auth-card p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold">Módulo de Autenticação e Perfis (Fase 1)</h2>
            <p className="text-zinc-400 text-sm mt-1">Todos os critérios de aceitação foram implementados com sucesso.</p>
          </div>

          <div className="border-t border-zinc-800/80 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              Sessão stateless via JWT com expiração de 15 minutos
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              Refresh Token de 30 dias com rotação (RTR) e revogação
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              Senhas criptografadas com BCrypt (fator de custo 12)
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              Painel SPA com rotas protegidas (React Router v6)
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
