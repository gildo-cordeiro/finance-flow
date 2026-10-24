import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/features/auth/components/AuthProvider';
import { AppRoutes } from '@/routes/AppRoutes';

export function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <Toaster position="top-right" />
    </AuthProvider>
  );
}
