import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCategories } from '../../../transactions/hooks/useCategories';
import { authApi } from '../../api/auth';
import {
  ShieldAlert,
  AlertTriangle,
  Download,
  Loader2
} from 'lucide-react';

export function DangerZoneTab() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { categories } = useCategories();

  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [dangerZoneError, setDangerZoneError] = useState<string | null>(null);

  const handleExportData = () => {
    const data = {
      user: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        currency: user?.currency,
        timeZone: user?.timeZone,
        dateFormat: user?.dateFormat
      },
      exportDate: new Date().toISOString(),
      app: 'FinanceFlow',
      categories: categories.map(c => ({ id: c.id, name: c.name, parentId: c.parentId, visibility: c.visibility })),
      status: 'SUCCESS'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financeflow_dados_${user?.name.toLowerCase().replace(/\s+/g, '_')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = async () => {
    if (confirmDeleteText !== 'CONFIRMAR') {
      return;
    }

    setIsDeletingAccount(true);
    setDangerZoneError(null);

    try {
      await authApi.deleteAccount();
      // Clear localStorage
      if (user) {
        localStorage.removeItem(`avatar_${user.id}`);
        localStorage.removeItem(`open_finance_${user.id}`);
        localStorage.removeItem(`date_format_${user.id}`);
        localStorage.removeItem('user_currency');
        localStorage.removeItem('user_timezone');
        localStorage.removeItem('user_date_format');
      }
      logout();
      navigate('/login');
    } catch (err: any) {
      setDangerZoneError(err.message || 'Ocorreu um erro ao excluir sua conta. Tente novamente.');
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-3 duration-200">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-red-400">Zona de Perigo</h2>
        <p className="text-zinc-400 text-sm mt-1">Ações destrutivas e exportação completa dos seus dados financeiros</p>
      </div>

      {dangerZoneError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{dangerZoneError}</span>
        </div>
      )}

      <div className="p-6 md:p-8 rounded-2xl space-y-6 border" style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
        {/* Action 1: Export Data */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-red-500/10 pb-6">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-zinc-350" />
              <span>Exportar Dados Pessoais</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">Faça o download de um arquivo JSON estruturado contendo suas categorias e configurações de conta.</p>
          </div>
          <button
            onClick={handleExportData}
            className="w-full sm:w-auto text-xs font-semibold py-2 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white transition-all flex items-center justify-center gap-1.5 border border-zinc-700"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar JSON
          </button>
        </div>

        {/* Action 2: Delete Account */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-red-455 flex items-center gap-2">
              <ShieldAlert className="w-4.5 h-4.5 text-red-400" />
              <span>Excluir Minha Conta</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              A exclusão de conta é <span className="text-red-450 font-bold uppercase">definitiva e irreversível</span>. Todos os seus dados de perfil, lançamentos manuais, categorias personalizadas e conexões de Open Finance serão excluídos para sempre de nossos servidores.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wide block">
              Digite <span className="text-red-455 font-bold">CONFIRMAR</span> para prosseguir com a exclusão:
            </label>
            <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
              <div className="flex-1 w-full">
                <input
                  type="text"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl py-2.5 px-4 text-white text-sm outline-none transition-all placeholder:text-zinc-700"
                  placeholder="Digite CONFIRMAR"
                  value={confirmDeleteText}
                  onChange={(e) => setConfirmDeleteText(e.target.value)}
                  disabled={isDeletingAccount}
                />
              </div>
              <button
                onClick={handleDeleteAccount}
                disabled={confirmDeleteText !== 'CONFIRMAR' || isDeletingAccount}
                className="w-full sm:w-auto text-xs font-bold py-2.5 px-6 rounded-xl bg-red-650 hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all shrink-0 flex items-center justify-center gap-2 shadow-lg shadow-red-700/10 border-0"
              >
                {isDeletingAccount && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Excluir Conta Permanentemente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
