import { CircleAlert } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { PageContainer } from '@/components/ui/PageContainer';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { errorMessage } from '@/services/errors';
import { CategoriesSection } from '../categories/components/CategoriesSection';
import { useProfile } from '../hooks/useProfile';
import { ProfileForm } from './ProfileForm';

type Tab = 'perfil' | 'categorias';

const TABS: TabItem<Tab>[] = [
  { value: 'perfil', label: 'Perfil' },
  { value: 'categorias', label: 'Categorias' },
];

export function SettingsPage() {
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get('aba') === 'categorias' ? 'categorias' : 'perfil';

  return (
    <PageContainer>
      <PageHeader title="Configurações" />
      <Tabs
        label="Seções das configurações"
        idPrefix="settings"
        items={TABS}
        value={tab}
        onChange={(next) => setParams(next === 'perfil' ? {} : { aba: next }, { replace: true })}
      >
        <Card className="max-w-2xl border-border-subtle">
          <CardContent className="p-6">{tab === 'perfil' ? <ProfileTab /> : <CategoriesSection />}</CardContent>
        </Card>
      </Tabs>
    </PageContainer>
  );
}

function ProfileTab() {
  const profile = useProfile();
  return (
    <>
      {profile.isPending && (
        <div role="status" aria-label="Carregando perfil" className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}
      {profile.isError && (
        <Alert variant="destructive">
          <CircleAlert className="h-4 w-4" />
          <AlertDescription>{errorMessage(profile.error)}</AlertDescription>
        </Alert>
      )}
      {profile.data && <ProfileForm profile={profile.data} />}
    </>
  );
}
