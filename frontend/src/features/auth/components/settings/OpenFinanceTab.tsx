import { RefreshCw, Info } from 'lucide-react';

export function OpenFinanceTab() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-3 duration-200">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Open Finance</h2>
        <p className="text-zinc-400 text-sm mt-1">Conecte seus bancos e cartões para sincronização automática de transações</p>
      </div>

      <div className="auth-card p-8 md:p-12 text-center max-w-2xl mx-auto space-y-4">
        <div className="w-16 h-16 bg-brand/10 border border-brand/20 rounded-2xl flex items-center justify-center mx-auto text-brand shadow-inner">
          <RefreshCw className="w-8 h-8 animate-spin-slow" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-zinc-100">Integração em Desenvolvimento</h3>
          <p className="text-zinc-400 text-sm max-w-md mx-auto leading-relaxed">
            A sincronização de contas e cartões via Open Finance estará disponível em breve para automatizar seus lançamentos de forma segura e transparente.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold bg-brand/15 text-brand border border-brand/20 px-3.5 py-1.5 rounded-full select-none">
          <Info className="w-3.5 h-3.5" />
          Em Breve
        </div>
      </div>
    </div>
  );
}
