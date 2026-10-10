import React, { useState } from 'react';
import { Key, AlertTriangle, CheckCircle } from 'lucide-react';
import { Input } from '../../../../../components/ui/Input';
import { Button } from '../../../../../components/ui/Button';
import { useToast } from '../../../../../context/ToastContext';
import { authApi } from '../../../api/auth';

export function PasswordForm() {
  const toast = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Por favor, preencha todos os campos.');
      setPasswordError('Por favor, preencha todos os campos.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      setPasswordError('As senhas não coincidem.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres.');
      setPasswordError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsChangingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      await authApi.changePassword({ currentPassword, newPassword });
      toast.success('Senha alterada com sucesso!');
      setPasswordSuccess('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 4000);
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || 'Erro ao alterar a senha. Verifique sua senha atual.');
      setPasswordError(error.message || 'Erro ao alterar a senha. Verifique sua senha atual.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="auth-card p-6 md:p-8 space-y-6">
      <div>
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Key className="w-5 h-5 text-violet-400" />
          <span>Alterar Senha</span>
        </h3>
        <p className="text-text-muted text-xs mt-1">
          Mantenha sua conta segura alterando sua senha de acesso periodicamente
        </p>
      </div>

      <form onSubmit={handleChangePassword} className="space-y-4">
        <Input
          type="password"
          label="Senha Atual"
          placeholder="Sua senha atual"
          value={currentPassword}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="password"
            label="Nova Senha"
            placeholder="Mínimo 6 caracteres"
            value={newPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
          />
          <Input
            type="password"
            label="Confirmar Nova Senha"
            placeholder="Repita a nova senha"
            value={confirmPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-800/80 mt-6">
          <div className="flex-1 w-full text-left">
            {passwordError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2.5 max-w-md animate-in fade-in duration-200">
                <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-start gap-2.5 max-w-md animate-in fade-in duration-200">
                <CheckCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <span>{passwordSuccess}</span>
              </div>
            )}
          </div>

          <Button
            type="submit"
            variant="secondary"
            loading={isChangingPassword}
            className="w-full sm:w-auto shrink-0"
          >
            Atualizar Senha
          </Button>
        </div>
      </form>
    </div>
  );
}
