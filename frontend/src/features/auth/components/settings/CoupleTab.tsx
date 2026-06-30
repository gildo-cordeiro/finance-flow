import React, { useState } from 'react';
import { useCouple } from '../../../couple/hooks/useCouple';
import {
  Loader2,
  AlertTriangle,
  CheckCircle,
  UserCheck,
  Trash2,
  Clock,
  Mail
} from 'lucide-react';
import { Input } from '../../../../components/ui/Input';
import { Button } from '../../../../components/ui/Button';

export function CoupleTab() {
  const {
    coupleStatus,
    isLoading: isCoupleLoading,
    invitePartner,
    isInviting,
    declineInvite,
    isDeclining,
    dissolveCouple,
    isDissolving
  } = useCouple();

  const [partnerEmail, setPartnerEmail] = useState('');
  const [coupleSuccessMsg, setCoupleSuccessMsg] = useState<string | null>(null);
  const [coupleErrorMsg, setCoupleErrorMsg] = useState<string | null>(null);
  const [showCoupleConfirmModal, setShowCoupleConfirmModal] = useState(false);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerEmail) return;

    setCoupleErrorMsg(null);
    setCoupleSuccessMsg(null);

    try {
      await invitePartner(partnerEmail);
      setCoupleSuccessMsg('Convite enviado com sucesso! Aguardando o parceiro aceitar.');
      setPartnerEmail('');
      setTimeout(() => setCoupleSuccessMsg(null), 5000);
    } catch (err: any) {
      setCoupleErrorMsg(err.message || 'Ocorreu um erro ao enviar o convite. Verifique o e-mail digitado.');
    }
  };

  const handleCancelInvite = async () => {
    setCoupleErrorMsg(null);
    setCoupleSuccessMsg(null);

    try {
      await declineInvite();
      setCoupleSuccessMsg('Convite cancelado com sucesso.');
      setTimeout(() => setCoupleSuccessMsg(null), 4000);
    } catch (err: any) {
      setCoupleErrorMsg(err.message || 'Falha ao cancelar o convite.');
    }
  };

  const handleDissolveCouple = async () => {
    setCoupleErrorMsg(null);
    setCoupleSuccessMsg(null);
    setShowCoupleConfirmModal(false);

    try {
      await dissolveCouple();
      setCoupleSuccessMsg('Vínculo de casal desfeito com sucesso.');
      setTimeout(() => setCoupleSuccessMsg(null), 4000);
    } catch (err: any) {
      setCoupleErrorMsg(err.message || 'Falha ao desvincular.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-3 duration-200">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Módulo de Casal</h2>
        <p className="text-zinc-400 text-sm mt-1">Conecte sua conta com a do seu parceiro para consolidar as finanças do casal</p>
      </div>

      {isCoupleLoading ? (
        <div className="auth-card p-8 flex flex-col items-center justify-center min-h-[200px]">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-3" />
          <p className="text-sm text-zinc-400">Carregando informações do casal...</p>
        </div>
      ) : (
        <div className="auth-card p-6 md:p-8 space-y-6 relative overflow-hidden">
          {/* Glowing effect */}
          <div className="absolute -right-20 -top-20 w-48 h-48 bg-pink-600/5 blur-[85px] rounded-full pointer-events-none" />

          {coupleSuccessMsg && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-start gap-3">
              <UserCheck className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{coupleSuccessMsg}</span>
            </div>
          )}

          {coupleErrorMsg && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{coupleErrorMsg}</span>
            </div>
          )}

          {/* Status: Connected / ACTIVE */}
          {coupleStatus.status === 'ACTIVE' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-sm text-emerald-450 font-medium">Parceiro conectado com sucesso. O compartilhamento está ativo.</span>
              </div>

              <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-pink-500/10 rounded-full flex items-center justify-center border border-pink-500/20 text-pink-400 font-semibold text-lg uppercase shadow-inner select-none">
                    {coupleStatus.partnerName?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100">{coupleStatus.partnerName}</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">{coupleStatus.partnerEmail}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCoupleConfirmModal(true)}
                  className="w-full sm:w-auto text-xs flex items-center justify-center gap-2 border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold rounded-xl px-4 py-2.5 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Desvincular Parceiro
                </button>
              </div>
            </div>
          )}

          {/* Status: PENDING */}
          {coupleStatus.status === 'PENDING' && (
            <div className="space-y-4">
              {coupleStatus.isSender ? (
                <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200">Convite Pendente Enviado</h3>
                      <p className="text-xs text-zinc-400 mt-1">
                        Você convidou <span className="text-violet-400 font-medium">{coupleStatus.partnerEmail}</span>. Aguardando a aceitação do convite.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="danger"
                    onClick={handleCancelInvite}
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
                      <h3 className="text-sm font-semibold text-zinc-200">Convite Pendente Recebido</h3>
                      <p className="text-xs text-zinc-400 mt-1">
                        <span className="text-violet-400 font-medium">{coupleStatus.partnerName}</span> ({coupleStatus.partnerEmail}) convidou você para vincular contas.
                      </p>
                    </div>
                  </div>
                  <a
                    href={`/couple/accept?token=${coupleStatus.inviteToken}`}
                    className="w-full sm:w-auto text-center bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg px-4 py-2.5 transition-all shadow-md"
                  >
                    Ver e Aceitar Convite
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Status: Disconnected / NONE */}
          {coupleStatus.status === 'NONE' && (
            <form onSubmit={handleSendInvite} className="space-y-4">
              <p className="text-sm text-zinc-300 leading-relaxed">
                Você não possui um parceiro vinculado no momento. Digite o e-mail cadastrado do seu parceiro para enviar um convite de vínculo.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
                <div className="flex-1 w-full">
                  <Input
                    type="email"
                    label="E-mail do Parceiro"
                    placeholder="parceiro@email.com"
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value)}
                    disabled={isInviting}
                    leftIcon={<Mail className="w-5 h-5 text-zinc-500" />}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  loading={isInviting}
                  className="w-full sm:w-auto h-[42px] px-6 shrink-0"
                >
                  Enviar convite
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* COUPLE DISSOLVE CONFIRMATION MODAL */}
      {showCoupleConfirmModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Desvincular Parceiro?</h3>
                <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                  Esta ação é <span className="text-red-400 font-semibold uppercase">irreversível</span>. O acesso cruzado aos dados financeiros de vocês será revogado imediatamente. O histórico de transações pessoais e compartilhadas permanecerá salvo em suas contas, mas não poderá mais ser visto de forma consolidada.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6 border-t border-zinc-800/80 pt-4">
              <button
                onClick={() => setShowCoupleConfirmModal(false)}
                className="bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-white font-medium rounded-xl py-2 px-4 transition-all text-sm"
              >
                Voltar
              </button>
              <button
                onClick={handleDissolveCouple}
                disabled={isDissolving}
                className="bg-red-650 hover:bg-red-600 text-white font-semibold rounded-xl py-2 px-5 transition-all text-sm flex items-center gap-2 shadow-lg shadow-red-700/10 border-0"
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
