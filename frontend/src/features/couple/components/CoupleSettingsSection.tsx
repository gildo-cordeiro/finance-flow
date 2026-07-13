import { useState } from 'react';
import { useCouple } from '../hooks/useCouple';
import { Heart, UserCheck, AlertTriangle, Loader2 } from 'lucide-react';
import { InvitePartnerForm } from './InvitePartnerForm';
import { PendingInviteCard } from './PendingInviteCard';
import { ActiveCoupleCard } from './ActiveCoupleCard';

export function CoupleSettingsSection() {
  const {
    coupleStatus,
    isLoading,
    invitePartner,
    isInviting,
    declineInvite,
    isDeclining,
    dissolveCouple,
    isDissolving,
  } = useCouple();

  const [partnerEmail, setPartnerEmail] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerEmail) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await invitePartner(partnerEmail);
      setSuccessMsg('Convite enviado com sucesso! Aguardando o parceiro aceitar.');
      setPartnerEmail('');
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      const error = err as { message?: string };
      setErrorMsg(error.message || 'Ocorreu um erro ao enviar o convite. Verifique o e-mail digitado.');
    }
  };

  const handleCancelInvite = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await declineInvite();
      setSuccessMsg('Convite cancelado com sucesso.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      const error = err as { message?: string };
      setErrorMsg(error.message || 'Falha ao cancelar o convite.');
    }
  };

  const handleDissolveCouple = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowConfirmModal(false);

    try {
      await dissolveCouple();
      setSuccessMsg('Vínculo de casal desfeito com sucesso.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      const error = err as { message?: string };
      setErrorMsg(error.message || 'Falha ao desvincular.');
    }
  };

  if (isLoading) {
    return (
      <div className="auth-card p-8 flex flex-col items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-3" />
        <p className="text-sm text-zinc-400">Carregando informações do casal...</p>
      </div>
    );
  }

  return (
    <div className="auth-card p-8 space-y-6 mt-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -right-20 -top-20 w-48 h-48 bg-violet-600/10 blur-[80px] rounded-full pointer-events-none" />

      <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-4">
        <div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400">
          <Heart className="w-5 h-5 fill-pink-500/10" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Módulo de Casal</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Gerencie o compartilhamento de suas finanças de forma segura
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-start gap-3">
          <UserCheck className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* SEM VÍNCULO */}
      {coupleStatus.status === 'NONE' && (
        <InvitePartnerForm
          partnerEmail={partnerEmail}
          onPartnerEmailChange={setPartnerEmail}
          isInviting={isInviting}
          onSendInvite={handleSendInvite}
        />
      )}

      {/* PENDENTE */}
      {coupleStatus.status === 'PENDING' && (
        <PendingInviteCard
          isSender={!!coupleStatus.isSender}
          partnerEmail={coupleStatus.partnerEmail || null}
          partnerName={coupleStatus.partnerName || null}
          inviteToken={coupleStatus.inviteToken || null}
          onCancelInvite={handleCancelInvite}
          isDeclining={isDeclining}
        />
      )}

      {/* ATIVO */}
      {coupleStatus.status === 'ACTIVE' && (
        <ActiveCoupleCard
          partnerName={coupleStatus.partnerName || null}
          partnerEmail={coupleStatus.partnerEmail || null}
          onDissolveClick={() => setShowConfirmModal(true)}
        />
      )}

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 animate-all">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Desvincular Parceiro?</h3>
                <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                  Esta ação é <span className="text-red-400 font-semibold uppercase">irreversível</span>. O
                  acesso cruzado aos dados financeiros de vocês será revogado imediatamente. O histórico de
                  transações pessoais e compartilhadas permanecerá salvo em suas contas, mas não poderá mais
                  ser visto de forma consolidada.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6 border-t border-zinc-800/80 pt-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-white font-medium rounded-xl py-2 px-4 transition-all text-sm cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={handleDissolveCouple}
                disabled={isDissolving}
                className="bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-semibold rounded-xl py-2 px-5 transition-all text-sm flex items-center gap-2 shadow-lg shadow-red-600/10 cursor-pointer disabled:opacity-50"
              >
                {isDissolving && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmar e Desvincular
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
