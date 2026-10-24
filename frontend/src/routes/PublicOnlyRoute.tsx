import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { FullScreenLoader } from './FullScreenLoader';
import { redirectTarget } from './navigation';

/** Login e cadastro: quem já tem sessão segue para a rota que pretendia abrir. */
export function PublicOnlyRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullScreenLoader />;
  if (status === 'authenticated') return <Navigate to={redirectTarget(location.state)} replace />;
  return <Outlet />;
}
