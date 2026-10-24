import { Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { NAV_ITEMS } from '@/components/layout/navItems';
import { UnderConstruction } from '@/components/layout/UnderConstruction';
import { LoginPage } from '@/features/auth/components/LoginPage';
import { RegisterPage } from '@/features/auth/components/RegisterPage';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicOnlyRoute } from './PublicOnlyRoute';

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
            <Route key={path} path={path} element={<UnderConstruction title={label} />} />
          ))}
          <Route path="*" element={<UnderConstruction title="Página não encontrada" />} />
        </Route>
      </Route>
    </Routes>
  );
}
