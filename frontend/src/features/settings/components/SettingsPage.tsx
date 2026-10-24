import { CircleAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PageContainer } from '@/components/ui/PageContainer';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Skeleton } from '@/components/ui/Skeleton';
import { errorMessage } from '@/services/errors';
import { CategoriesSection } from '../categories/components/CategoriesSection';
import { useProfile } from '../hooks/useProfile';
import { ProfileForm } from './ProfileForm';

export function SettingsPage() {
  const profile = useProfile();

  return (
    <PageContainer>
      <PageHeader title="Configurações" />
      <Card className="max-w-2xl border-border-subtle">
        <CardHeader>
          <h2>
            <SectionLabel>Perfil</SectionLabel>
          </h2>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
      <Card className="mt-6 max-w-2xl border-border-subtle">
        <CardHeader>
          <h2>
            <SectionLabel>Categorias</SectionLabel>
          </h2>
        </CardHeader>
        <CardContent>
          <CategoriesSection />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
