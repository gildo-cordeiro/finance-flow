import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../api/auth';
import { useToast } from '../../../../context/ToastContext';
import {
  User,
  Globe,
  DollarSign,
  Calendar,
  CalendarDays,
  Key,
  AlertTriangle,
  CheckCircle,
  Camera,
  Trash2
} from 'lucide-react';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Button } from '../../../../components/ui/Button';

const TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'Brasília (GMT-3)' },
  { value: 'UTC', label: 'UTC (GMT+0)' },
  { value: 'America/New_York', label: 'New York (GMT-5)' },
  { value: 'Europe/London', label: 'London (GMT+0)' },
  { value: 'Europe/Paris', label: 'Paris (GMT+1)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (GMT+9)' }
];

const CURRENCIES = [
  { value: 'BRL', label: 'Real (R$)' },
  { value: 'USD', label: 'Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'Pound (£)' }
];

const DATE_FORMATS = [
  { value: 'dd/MM/yyyy', label: 'DD/MM/AAAA' },
  { value: 'yyyy-MM-dd', label: 'AAAA-MM-DD' }
];

export function ProfileTab() {
  const { user, updateProfile } = useAuth();
  const toast = useToast();

  // Profile preferences
  const [name, setName] = useState('');
  const [timeZone, setTimeZone] = useState('America/Sao_Paulo');
  const [currency, setCurrency] = useState('BRL');
  const [budgetClosingDay, setBudgetClosingDay] = useState(1);
  const [dateFormat, setDateFormat] = useState('dd/MM/yyyy');
  const [avatar, setAvatar] = useState<string | null>(null);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Change password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Load preferences from user object
  useEffect(() => {
    if (user) {
      setName(user.name);
      setTimeZone(user.timeZone);
      setCurrency(user.currency);
      setBudgetClosingDay(user.budgetClosingDay);
      setDateFormat(user.dateFormat || 'dd/MM/yyyy');

      const savedAvatar = localStorage.getItem(`avatar_${user.id}`);
      if (savedAvatar) {
        setAvatar(savedAvatar);
      } else {
        setAvatar(null);
      }
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 1MB.');
        setProfileError('A imagem deve ter no máximo 1MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatar(base64String);
        if (user) {
          localStorage.setItem(`avatar_${user.id}`, base64String);
          // Emit event to update sidebar
          window.dispatchEvent(new CustomEvent('avatar-changed'));
          toast.success('Foto de perfil atualizada!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatar(null);
    if (user) {
      localStorage.removeItem(`avatar_${user.id}`);
      window.dispatchEvent(new CustomEvent('avatar-changed'));
      toast.success('Foto de perfil removida.');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !timeZone || !currency || !budgetClosingDay || !dateFormat) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      setProfileError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      await updateProfile({
        name,
        timeZone,
        currency,
        budgetClosingDay: Number(budgetClosingDay),
        dateFormat
      });
      
      // Update local storage values for immediate global UI reactivity
      localStorage.setItem('user_currency', currency);
      localStorage.setItem('user_timezone', timeZone);
      localStorage.setItem('user_date_format', dateFormat);
      
      toast.success('Configurações atualizadas com sucesso!');
      setProfileSuccess('Configurações atualizadas com sucesso!');
      setTimeout(() => setProfileSuccess(null), 3000);
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || 'Falha ao atualizar configurações.');
      setProfileError(error.message || 'Falha ao atualizar configurações.');
    } finally {
      setIsSavingProfile(false);
    }
  };

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
    <div className="space-y-8 animate-in fade-in slide-in-from-right-3 duration-200">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Preferências do Perfil</h2>
        <p className="text-zinc-400 text-sm mt-1">Gerencie seus dados pessoais, idioma, fuso horário e segurança</p>
      </div>


      <div className="auth-card p-6 md:p-8 space-y-6">
        {/* Avatar Upload Container */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-zinc-800/80">
          <div className="relative group shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-brand/10 border border-brand/20 flex items-center justify-center text-2xl font-bold text-brand shadow-inner">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                name ? name.charAt(0).toUpperCase() : 'U'
              )}
            </div>
            <label className="absolute inset-0 flex items-center justify-center bg-zinc-950/70 opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity duration-200 border border-zinc-800">
              <Camera className="w-5 h-5 text-zinc-200" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </label>
          </div>
          <div className="flex flex-col items-center sm:items-start gap-2">
            <h4 className="text-sm font-semibold text-zinc-200">Foto de Perfil</h4>
            <p className="text-xs text-zinc-500">Recomendado: PNG ou JPG quadrada, de até 1MB.</p>
            <div className="flex gap-2.5 mt-1 select-none">
              <label className="text-xs font-semibold bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/30 px-3.5 py-2 rounded-xl cursor-pointer transition-all hover:text-white">
                Escolher imagem
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
              {avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remover
                </button>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              type="text"
              label="Nome Completo"
              placeholder="Seu nome"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<User className="w-5 h-5 text-zinc-500" />}
            />

            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-xs font-semibold text-zinc-350 uppercase tracking-wide">E-mail (Somente leitura)</label>
              <input
                type="email"
                disabled
                className="w-full bg-zinc-900/30 border border-zinc-900/80 text-zinc-550 rounded-xl py-2.5 px-4 text-sm cursor-not-allowed outline-none"
                value={user?.email || ''}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              label="Moeda Principal"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              leftIcon={<DollarSign className="w-5 h-5 text-zinc-500" />}
            >
              {CURRENCIES.map(c => (
                <option key={c.value} value={c.value} className="bg-zinc-900">{c.label}</option>
              ))}
            </Select>

            <Select
              label="Fuso Horário"
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              leftIcon={<Globe className="w-5 h-5 text-zinc-500" />}
            >
              {TIMEZONES.map(t => (
                <option key={t.value} value={t.value} className="bg-zinc-900">{t.label}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              type="number"
              label="Dia de Fechamento do Orçamento"
              required
              min="1"
              max="31"
              value={budgetClosingDay}
              onChange={(e) => setBudgetClosingDay(Number(e.target.value))}
              leftIcon={<Calendar className="w-5 h-5 text-zinc-500" />}
            />

            <Select
              label="Formato de Data"
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              leftIcon={<CalendarDays className="w-5 h-5 text-zinc-500" />}
            >
              {DATE_FORMATS.map(f => (
                <option key={f.value} value={f.value} className="bg-zinc-900">{f.label}</option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-800/80 mt-6">
            <div className="flex-1 w-full text-left">
              {profileError && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2.5 max-w-md animate-in fade-in duration-200">
                  <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <span>{profileError}</span>
                </div>
              )}

              {profileSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-start gap-2.5 max-w-md animate-in fade-in duration-200">
                  <CheckCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <span>{profileSuccess}</span>
                </div>
              )}
            </div>

            <Button type="submit" loading={isSavingProfile} className="w-full sm:w-auto shrink-0">
              Salvar Preferências
            </Button>
          </div>
        </form>
      </div>

      <div className="auth-card p-6 md:p-8 space-y-6">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Key className="w-5 h-5 text-violet-400" />
            <span>Alterar Senha</span>
          </h3>
          <p className="text-zinc-500 text-xs mt-1">Mantenha sua conta segura alterando sua senha de acesso periodicamente</p>
        </div>


        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            type="password"
            label="Senha Atual"
            placeholder="Sua senha atual"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="password"
              label="Nova Senha"
              placeholder="Mínimo 6 caracteres"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              type="password"
              label="Confirmar Nova Senha"
              placeholder="Repita a nova senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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

            <Button type="submit" variant="secondary" loading={isChangingPassword} className="w-full sm:w-auto shrink-0">
              Atualizar Senha
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
