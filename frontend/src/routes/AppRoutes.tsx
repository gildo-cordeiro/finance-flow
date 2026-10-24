import type { ReactNode } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { NAV_ITEMS } from '@/components/layout/navItems';
import { UnderConstruction } from '@/components/layout/UnderConstruction';
import { AccountsPage } from '@/features/accounts/components/AccountsPage';
import { CardsSection } from '@/features/cards/components/CardsSection';
import { InvoicePage } from '@/features/cards/components/InvoicePage';
import { BudgetPage } from '@/features/budget/components/BudgetPage';
import { DashboardPage } from '@/features/dashboard/components/DashboardPage';
import { ForgotPasswordPage } from '@/features/auth/components/ForgotPasswordPage';
import { LoginPage } from '@/features/auth/components/LoginPage';
import { RegisterPage } from '@/features/auth/components/RegisterPage';
import { ResetPasswordPage } from '@/features/auth/components/ResetPasswordPage';
import { SettingsPage } from '@/features/settings/components/SettingsPage';
import { TransactionsPage } from '@/features/transactions/components/TransactionsPage';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicOnlyRoute } from './PublicOnlyRoute';

// Itens da navegação que já têm página; os demais mostram "Em construção"
const PAGES: Record<string, ReactNode> = {
  '/': <DashboardPage />,
  '/transacoes': <TransactionsPage />,
  '/contas': <AccountsPage cards={<CardsSection />} />,
  '/orcamento': <BudgetPage />,
  '/configuracoes': <SettingsPage />,
};

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/entrar" element={<LoginPage />} />
        <Route path="/cadastrar" element={<RegisterPage />} />
        <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
      </Route>
      <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
      <Route path="/privacidade" element={<UnderConstruction title="Política de privacidade" />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {NAV_ITEMS.map(({ path, label }) => (
            <Route key={path} path={path} element={PAGES[path] ?? <UnderConstruction title={label} />} />
          ))}
          <Route path="/cartoes/:cardId/fatura" element={<InvoicePage />} />
          <Route path="/cartoes/:cardId/faturas/:invoiceId" element={<InvoicePage />} />
          <Route path="*" element={<UnderConstruction title="Página não encontrada" />} />
        </Route>
      </Route>
    </Routes>
  );
}
