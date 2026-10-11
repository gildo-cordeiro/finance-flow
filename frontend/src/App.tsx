import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './features/auth/context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ViewProvider } from './context/ViewContext';
import { AppRoutes } from './routes/AppRoutes';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Button } from '@/components/ui/Button';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <ViewProvider>
            <ErrorBoundary
              fallback={
                <div role="alert" className="min-h-screen bg-bg-base flex flex-col items-center justify-center gap-4 p-8 text-center">
                  <p className="text-sm font-semibold text-text-primary">Algo deu errado.</p>
                  <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
                    Recarregar a página
                  </Button>
                </div>
              }
            >
              <AppRoutes />
            </ErrorBoundary>
          </ViewProvider>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
