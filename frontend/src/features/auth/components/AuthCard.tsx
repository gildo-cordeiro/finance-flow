import type { ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card';

interface AuthCardProps {
  title: string;
  subtitle: string;
  error?: string | null;
  footer: ReactNode;
  children: ReactNode;
}

export function AuthCard({ title, subtitle, error, footer, children }: AuthCardProps) {
  return (
    <main className="gradient-bg flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md bg-card/80 backdrop-blur">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary">
            <span className="text-lg font-bold tracking-wider text-primary-foreground">FF</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <CardDescription>{subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <CircleAlert className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {children}
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">{footer}</CardFooter>
      </Card>
    </main>
  );
}
