import { ProfileForm } from './ProfileTab/ProfileForm';
import { PasswordForm } from './ProfileTab/PasswordForm';

export function ProfileTab() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-3 duration-200">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Preferências do Perfil</h2>
        <p className="text-zinc-400 text-sm mt-1">
          Gerencie seus dados pessoais, idioma, fuso horário e segurança
        </p>
      </div>

      <ProfileForm />
      <PasswordForm />
    </div>
  );
}
