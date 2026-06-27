import { useCouple } from '../hooks/useCouple';
import { useView } from '../../../context/ViewContext';
import { User, Users } from 'lucide-react';

export function CoupleToggle() {
  const { coupleStatus } = useCouple();
  const { viewContext, setViewContext } = useView();

  if (coupleStatus.status !== 'ACTIVE') {
    return null;
  }

  return (
    <div className="flex items-center bg-zinc-900/80 border border-zinc-800 p-1 rounded-xl shadow-lg">
      <button
        onClick={() => setViewContext('PERSONAL')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          viewContext === 'PERSONAL'
            ? 'bg-violet-600 text-white shadow-md shadow-violet-600/10'
            : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <User className="w-3.5 h-3.5" />
        Pessoal
      </button>
      <button
        onClick={() => setViewContext('COUPLE')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          viewContext === 'COUPLE'
            ? 'bg-violet-600 text-white shadow-md shadow-violet-600/10'
            : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <Users className="w-3.5 h-3.5" />
        Casal
      </button>
    </div>
  );
}
