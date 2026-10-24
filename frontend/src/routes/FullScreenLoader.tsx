import { LoaderCircle } from 'lucide-react';

export function FullScreenLoader() {
  return (
    <div role="status" className="min-h-screen flex items-center justify-center text-text-muted">
      <LoaderCircle className="w-6 h-6 animate-spin" />
      <span className="sr-only">Carregando</span>
    </div>
  );
}
