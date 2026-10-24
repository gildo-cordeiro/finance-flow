import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { FullScreenLoader } from './FullScreenLoader';
import type { RedirectState } from './navigation';

export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullScreenLoader />;
  if (status === 'anonymous') {
    const state: RedirectState = { from: location };
    return <Navigate to="/entrar" replace state={state} />;
  }
  return <Outlet />;
}
