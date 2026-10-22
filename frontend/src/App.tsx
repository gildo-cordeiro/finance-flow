import { Route, Routes } from 'react-router-dom';
import { PageContainer } from '@/components/ui/PageContainer';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

// Ponto de partida: as rotas de cada feature entram aqui conforme forem implementadas.
export function App() {
  return (
    <Routes>
      <Route
        path="*"
        element={
          <PageContainer>
            <PageHeader title="FinanceFlow" subtitle="Controle financeiro pessoal" />
            <EmptyState title="Em construção" description="As primeiras telas chegam com a Fase 1." />
          </PageContainer>
        }
      />
    </Routes>
  );
}
