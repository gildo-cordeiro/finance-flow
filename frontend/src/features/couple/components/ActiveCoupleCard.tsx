import { Trash2 } from 'lucide-react';

interface ActiveCoupleCardProps {
  partnerName: string | null;
  partnerEmail: string | null;
  onDissolveClick: () => void;
}

export function ActiveCoupleCard({
  partnerName,
  partnerEmail,
  onDissolveClick,
}: ActiveCoupleCardProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-300">
        Você está vinculado atualmente a um parceiro. A visão de casal está ativada no topo do painel
        principal.
      </p>
      <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-pink-500/10 rounded-full flex items-center justify-center border border-pink-500/20 text-pink-400 font-semibold text-lg uppercase shadow-inner select-none shrink-0">
            {partnerName?.charAt(0) || 'P'}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">{partnerName}</h3>
            <p className="text-xs text-zinc-400 mt-0.5">{partnerEmail}</p>
          </div>
        </div>
        <button
          onClick={onDissolveClick}
          className="w-full sm:w-auto text-xs flex items-center justify-center gap-2 border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold rounded-xl px-4 py-2.5 transition-all cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          Desvincular
        </button>
      </div>
    </div>
  );
}
