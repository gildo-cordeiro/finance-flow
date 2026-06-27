import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { useCouple } from '../hooks/useCouple';
import { Heart, UserCheck, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export function AcceptInvite() {
  const { isAuthenticated, isInitializing } = useAuth();
  const { coupleStatus, acceptInvite, isAccepting, declineInvite, isDeclining, isLoading } = useCouple();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  console.log('[AcceptInvite] rendered. isAuthenticated:', isAuthenticated, 'isInitializing:', isInitializing, 'isLoading:', isLoading, 'token:', token, 'coupleStatus:', coupleStatus);

  useEffect(() => {
    if (!token) {
      setErrorMsg('Token de convite inválido ou ausente.');
    }
  }, [token]);

  useEffect(() => {
    if (coupleStatus.status === 'ACTIVE') {
      console.log('[AcceptInvite] Couple is already ACTIVE. Redirecting to home...');
      navigate('/');
    }
  }, [coupleStatus.status, navigate]);

  const handleAccept = async () => {
    if (!token) return;
    setErrorMsg(null);
    try {
      await acceptInvite(token);
      navigate('/');
    } catch (err) {
      const error = err as { message?: string };
      setErrorMsg(error.message || 'Falha ao aceitar o convite. O token pode estar expirado ou ser inválido.');
    }
  };

  const handleDecline = async () => {
    setErrorMsg(null);
    try {
      await declineInvite();
      navigate('/');
    } catch (err) {
      const error = err as { message?: string };
      setErrorMsg(error.message || 'Falha ao recusar o convite.');
    }
  };

  if (isInitializing || isLoading) {
    return (
      <div className="gradient-bg min-h-screen flex items-center justify-center p-4 text-white">
        <div className="auth-card w-full max-w-md p-8 flex flex-col items-center justify-center min-h-[250px]">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-4" />
          <p className="text-sm text-zinc-400">Verificando convite...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="gradient-bg min-h-screen flex items-center justify-center p-4 text-white">
        <div className="auth-card w-full max-w-md p-8 text-center space-y-6 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-36 h-36 bg-pink-500/10 blur-[60px] rounded-full" />
          
          <div className="mx-auto w-16 h-16 bg-pink-500/10 border border-pink-500/20 rounded-full flex items-center justify-center text-pink-400 animate-pulse">
            <Heart className="w-8 h-8 fill-pink-500/10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Convite de Casal</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Você foi convidado para gerenciar as finanças em casal no FinanceFlow! Acompanhe despesas, planeje orçamentos conjuntos e poupe dinheiro lado a lado.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <Button
              className="w-full"
              onClick={() => navigate(`/login?redirectTo=${encodeURIComponent(`/couple/accept?token=${token}`)}`)}
            >
              Entrar na minha conta
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => navigate(`/register?redirectTo=${encodeURIComponent(`/couple/accept?token=${token}`)}`)}
            >
              Criar uma nova conta
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gradient-bg min-h-screen flex items-center justify-center p-4 text-white">
      <div className="auth-card w-full max-w-md p-8 space-y-6 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-36 h-36 bg-pink-500/10 blur-[60px] rounded-full" />

        <div className="mx-auto w-16 h-16 bg-pink-500/10 border border-pink-500/20 rounded-full flex items-center justify-center text-pink-400">
          <Heart className="w-8 h-8 fill-pink-500/10" />
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Aceitar Convite</h2>
          {coupleStatus.status === 'PENDING' && !coupleStatus.isSender ? (
            <p className="text-sm text-zinc-400 leading-relaxed">
              <span className="text-violet-400 font-semibold">{coupleStatus.partnerName}</span> ({coupleStatus.partnerEmail}) te convidou para gerenciar as finanças juntos.
            </p>
          ) : (
            <p className="text-sm text-zinc-400 leading-relaxed">
              Deseja aceitar o convite para iniciar o compartilhamento financeiro com o parceiro?
            </p>
          )}
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-4">
          <Button
            className="w-full"
            onClick={handleAccept}
            loading={isAccepting}
            disabled={!token || isDeclining}
          >
            <UserCheck className="w-5 h-5 mr-2" />
            Aceitar Convite
          </Button>
          <Button
            variant="danger"
            className="w-full bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
            onClick={handleDecline}
            loading={isDeclining}
            disabled={isAccepting}
          >
            Recusar Convite
          </Button>
        </div>
      </div>
    </div>
  );
}
