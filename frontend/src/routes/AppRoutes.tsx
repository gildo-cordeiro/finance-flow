import type { ReactNode } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { NAV_ITEMS } from '@/components/layout/navItems';
import { UnderConstruction } from '@/components/layout/UnderConstruction';
import { AccountsPage } from '@/features/accounts/components/AccountsPage';
import { LoginPage } from '@/features/auth/components/LoginPage';
import { RegisterPage } from '@/features/auth/components/RegisterPage';
import { SettingsPage } from '@/features/settings/components/SettingsPage';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicOnlyRoute } from './PublicOnlyRoute';

// Itens da navegação que já têm página; os demais mostram "Em construção"
const PAGES: Record<string, ReactNode> = {
  '/contas': <AccountsPage />,
  '/configuracoes': <SettingsPage />,
};

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/entrar" element={<LoginPage />} />
        <Route path="/cadastrar" element={<RegisterPage />} />
      </Route>
      <Route path="/privacidade" element={<UnderConstruction title="Política de privacidade" />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {NAV_ITEMS.map(({ path, label }) => (
            <Route key={path} path={path} element={PAGES[path] ?? <UnderConstruction title={label} />} />
          ))}
          <Route path="*" element={<UnderConstruction title="Página não encontrada" />} />
        </Route>
      </Route>
    </Routes>
  );
}
