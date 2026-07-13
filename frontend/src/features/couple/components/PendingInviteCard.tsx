import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface PendingInviteCardProps {
  isSender: boolean;
  partnerEmail: string | null;
  partnerName: string | null;
  inviteToken: string | null;
  onCancelInvite: () => void;
  isDeclining: boolean;
}

export function PendingInviteCard({
  isSender,
  partnerEmail,
  partnerName,
  inviteToken,
  onCancelInvite,
  isDeclining,
}: PendingInviteCardProps) {
  return (
    <div className="space-y-4">
      {isSender ? (
        <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h3 className="text-sm font-semibold text-zinc-200">Convite Pendente</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Você enviou um convite para{' '}
                <span className="text-violet-400 font-medium">{partnerEmail}</span>. Aguardando
                aceitação dele(a).
              </p>
            </div>
          </div>
          <Button
            variant="danger"
            onClick={onCancelInvite}
            loading={isDeclining}
            className="w-full sm:w-auto text-xs bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 px-4 py-2 h-auto"
          >
            Cancelar convite
          </Button>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-zinc-200">Convite Recebido</h3>
              <p className="text-xs text-zinc-400 mt-1">
                <span className="text-violet-400 font-medium">{partnerName}</span> ({' '}
                <span className="text-zinc-400">{partnerEmail}</span>) te convidou para fazer parte
                de um casal.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              to={`/couple/accept?token=${inviteToken}`}
              className="w-full sm:w-auto text-center bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg px-4 py-2 transition-all shadow-md shadow-violet-600/10"
            >
              Ver convite
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
