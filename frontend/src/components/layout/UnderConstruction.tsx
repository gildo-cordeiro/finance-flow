import { Construction } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageContainer } from '@/components/ui/PageContainer';
import { PageHeader } from '@/components/ui/PageHeader';

export function UnderConstruction({ title }: { title: string }) {
  return (
    <PageContainer>
      <PageHeader title={title} />
      <EmptyState
        icon={<Construction className="w-6 h-6" />}
        title="Em construção"
        description="Esta página chega nas próximas entregas da Fase 1."
      />
    </PageContainer>
  );
}
