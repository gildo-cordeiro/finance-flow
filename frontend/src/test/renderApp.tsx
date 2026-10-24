import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { routerFuture } from '@/routes/navigation';
import { App } from '@/App';

export function renderApp(route = '/') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]} future={routerFuture}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>
  );
}
