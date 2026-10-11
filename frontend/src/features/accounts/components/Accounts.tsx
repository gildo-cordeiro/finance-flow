import { useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import {
  useAccounts,
  useArchiveAccount,
  useUnarchiveAccount,
  useCloseAccount,
  useDeleteAccount,
} from '../hooks/useAccounts';
import { useView } from '../../../context/ViewContext';
import { useCouple } from '../../couple/hooks/useCouple';
import { Landmark, CreditCard, Plus, Archive, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import type { Account } from '../types';
import { AccountsSummary } from './AccountsSummary';
import { AccountCard, type DropdownAction } from './AccountCard';
import { CreateBankModal, CreateCardModal, EditModal, parseApiError } from './AccountModal';
import { ConfirmModal, confirmConfig, type ConfirmAction } from './AccountActionModals';
import { Pencil, Archive as ArchiveIcon, ArchiveRestore, Lock, Trash2 } from 'lucide-react';
import { PageContainer } from '../../../components/ui/PageContainer';
import { PageHeader } from '../../../components/ui/PageHeader';

export function Accounts() {
  const { user } = useAuth();
  const { accounts, isLoading, error, createAccount, isCreating } = useAccounts();
  const { viewContext } = useView();
  const { coupleStatus } = useCouple();

  // Mutations
  const archiveAccount = useArchiveAccount();
  const unarchiveAccount = useUnarchiveAccount();
  const closeAccount = useCloseAccount();
  const deleteAccount = useDeleteAccount();

  // UI state
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  // Confirm modals
  const [confirm, setConfirm] = useState<{ action: ConfirmAction; account: Account } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const isCouple = viewContext === 'COUPLE';
  const partnerName = coupleStatus.partnerName || 'Parceiro(a)';

  if (!user) return null;

  // Split accounts by status
  const activeAccounts = accounts.filter((a) => a.status === 'ACTIVE' || a.status === 'CLOSED');
  const archivedAccounts = accounts.filter((a) => a.status === 'ARCHIVED');

  const bankAccounts = activeAccounts.filter((acc) => acc.type === 'CHECKING' || acc.type === 'SAVINGS');
  const creditCards = activeAccounts.filter((acc) => acc.type === 'CREDIT_CARD');

  const sortedActiveAccounts = [...activeAccounts].sort((a, b) => {
    const aIsCard = a.type === 'CREDIT_CARD' ? 1 : 0;
    const bIsCard = b.type === 'CREDIT_CARD' ? 1 : 0;
    if (aIsCard !== bIsCard) return aIsCard - bIsCard;
    return a.name.localeCompare(b.name);
  });

  const handleConfirm = async () => {
    if (!confirm) return;
    setConfirmLoading(true);
    setConfirmError(null);
    try {
      const id = confirm.account.id;
      if (confirm.action === 'archive') await archiveAccount.mutateAsync(id);
      if (confirm.action === 'unarchive') await unarchiveAccount.mutateAsync(id);
      if (confirm.action === 'close') await closeAccount.mutateAsync(id);
      if (confirm.action === 'delete') await deleteAccount.mutateAsync(id);
      setConfirm(null);
    } catch (err) {
      setConfirmError(parseApiError(err));
    } finally {
      setConfirmLoading(false);
    }
  };

  const getAccountActions = (account: Account): DropdownAction[] => {
    if (account.userId !== user.id) return [];
    const isClosed = account.status === 'CLOSED';
    const isArchived = account.status === 'ARCHIVED';
    const isCreditCard = account.type === 'CREDIT_CARD';
    const actions: DropdownAction[] = [];

    if (!isClosed)
      actions.push({
        label: 'Editar',
        icon: <Pencil className="w-4 h-4" />,
        onClick: () => setEditingAccount(account),
      });
    if (!isArchived && !isClosed)
      actions.push({
        label: 'Arquivar',
        icon: <ArchiveIcon className="w-4 h-4" />,
        onClick: () => {
          setConfirmError(null);
          setConfirm({ action: 'archive', account });
        },
      });
    if (isArchived)
      actions.push({
        label: 'Reativar',
        icon: <ArchiveRestore className="w-4 h-4" />,
        onClick: () => {
          setConfirmError(null);
          setConfirm({ action: 'unarchive', account });
        },
      });
    if (!isArchived && !isClosed && !isCreditCard)
      actions.push({
        label: 'Encerrar conta',
        icon: <Lock className="w-4 h-4" />,
        onClick: () => {
          setConfirmError(null);
          setConfirm({ action: 'close', account });
        },
        danger: true,
      });
    actions.push({
      label: 'Excluir',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => {
        setConfirmError(null);
        setConfirm({ action: 'delete', account });
      },
      danger: true,
    });

    return actions;
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: user.currency }).format(val);

  return (
    <>
      {isCouple && (
        <div className="bg-violet-500/10 border-b border-violet-500/20 py-2 text-center">
          <span className="text-violet-300 text-xs font-medium">
            🫂 Você está vendo as contas do casal ({user.name} & {partnerName})
          </span>
        </div>
      )}

      <PageContainer>
        <PageHeader
          title="Contas & Cartões"
          subtitle="Gerencie contas bancárias e cartões de crédito"
          actions={
            <>
              <button
                onClick={() => setIsBankModalOpen(true)}
                className="bg-bg-surface hover:bg-bg-elevated border border-border-subtle hover:border-violet-500/40 text-text-primary font-medium text-sm rounded-xl px-4 py-2.5 transition-all flex items-center gap-2 cursor-pointer group"
              >
                <Landmark className="w-4 h-4 text-violet-400 group-hover:text-violet-300 transition-colors" />
                <span>Nova Conta</span>
              </button>
              <button
                onClick={() => setIsCardModalOpen(true)}
                className="bg-brand hover:bg-brand-hover text-white font-medium text-sm rounded-xl px-4 py-2.5 shadow-lg shadow-brand/25 transition-all flex items-center gap-2 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Novo Cartão</span>
              </button>
            </>
          }
        />

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-danger max-w-lg mx-auto text-center space-y-4">
            <AlertTriangle className="w-12 h-12 mx-auto" />
            <h3 className="font-bold text-lg">Erro ao carregar contas</h3>
            <p className="text-sm text-red-400/80">{error.message}</p>
          </div>
        ) : (
          <div className="space-y-12">
            {accounts.length === 0 ? (
              <div className="bg-bg-surface border border-border-subtle p-12 text-center max-w-lg mx-auto space-y-6 rounded-2xl">
                <div className="w-16 h-16 bg-bg-elevated rounded-2xl flex items-center justify-center mx-auto border border-border-subtle">
                  <Landmark className="w-8 h-8 text-text-secondary" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold">Nenhuma conta cadastrada</h3>
                  <p className="text-sm text-text-secondary">
                    Comece adicionando uma conta corrente, poupança ou cartão de crédito.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setIsBankModalOpen(true)}
                    className="bg-bg-elevated hover:bg-bg-surface border border-border-subtle hover:border-violet-500/40 text-text-primary font-medium text-sm rounded-xl px-5 py-2.5 transition-all inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Landmark className="w-4 h-4 text-violet-400" /> Nova Conta
                  </button>
                  <button
                    onClick={() => setIsCardModalOpen(true)}
                    className="bg-brand hover:bg-brand-hover text-white font-medium text-sm rounded-xl px-5 py-2.5 shadow-lg shadow-brand/20 transition-all inline-flex items-center gap-2 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" /> Novo Cartão
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Consolidated Summary */}
                <AccountsSummary accounts={accounts} currency={user.currency} />

                {/* Grid list of active accounts */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedActiveAccounts.map((account) => {
                    const actions = getAccountActions(account);
                    const associatedCardsSum = creditCards
                      .filter((card) => card.associatedAccountId === account.id)
                      .reduce((sum, card) => sum + (card.balance || 0), 0);
                    const payingAccount = bankAccounts.find(
                      (acc) => acc.id === account.associatedAccountId
                    );

                    return (
                      <AccountCard
                        key={account.id}
                        account={account}
                        actions={actions}
                        currency={user.currency}
                        isCouple={isCouple}
                        partnerName={partnerName}
                        currentUserId={user.id}
                        associatedCardsSum={associatedCardsSum}
                        payingAccountName={payingAccount?.name}
                      />
                    );
                  })}
                  {/* Phantom cards */}
                  <div className="border-2 border-dashed border-border-subtle bg-bg-surface/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 min-h-[220px]">
                    <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                      Adicionar
                    </p>
                    <div className="flex flex-col gap-2 w-full max-w-[160px]">
                      <button
                        onClick={() => setIsBankModalOpen(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border-subtle hover:border-violet-500/40 hover:bg-bg-elevated text-text-secondary hover:text-text-primary text-sm font-medium transition-all cursor-pointer group"
                      >
                        <Landmark className="w-4 h-4 text-violet-400 shrink-0" /> Nova Conta
                      </button>
                      <button
                        onClick={() => setIsCardModalOpen(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-brand/30 hover:border-brand/60 hover:bg-brand/10 text-brand text-sm font-medium transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4 shrink-0" /> Novo Cartão
                      </button>
                    </div>
                  </div>
                </div>

                {/* Archived Section */}
                {archivedAccounts.length > 0 && (
                  <div className="space-y-4">
                    <button
                      onClick={() => setShowArchived((v) => !v)}
                      className="flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer group"
                    >
                      {showArchived ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      <Archive className="w-4 h-4 text-text-muted group-hover:text-text-secondary transition-colors" />
                      Arquivadas ({archivedAccounts.length})
                    </button>
                    {showArchived && (
                      <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                        {archivedAccounts.map((account) => (
                          <AccountCard
                            key={account.id}
                            account={account}
                            actions={getAccountActions(account)}
                            currency={user.currency}
                            isCouple={isCouple}
                            partnerName={partnerName}
                            currentUserId={user.id}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </PageContainer>

      {/* Modals */}
      <CreateBankModal
        open={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        onCreate={createAccount}
        isCreating={isCreating}
        currency={user.currency}
      />
      <CreateCardModal
        open={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        onCreate={createAccount}
        isCreating={isCreating}
        currency={user.currency}
        bankAccounts={bankAccounts}
        formatCurrency={formatCurrency}
      />
      <EditModal
        account={editingAccount}
        onClose={() => setEditingAccount(null)}
        currency={user.currency}
      />

      {confirm && (
        <ConfirmModal
          open
          title={confirmConfig[confirm.action].title}
          description={confirmConfig[confirm.action].description}
          confirmLabel={confirmConfig[confirm.action].label}
          danger={confirmConfig[confirm.action].danger}
          onConfirm={handleConfirm}
          onCancel={() => {
            setConfirm(null);
            setConfirmError(null);
          }}
          loading={confirmLoading}
          errorMessage={confirmError}
        />
      )}
    </>
  );
}
