import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Lugar reservado para a central de notificações (F1-19)
export function NotificationsButton() {
  return (
    <Button
      variant="ghost"
      size="icon"
      disabled
      aria-label="Notificações (em breve)"
      title="Notificações (em breve)"
      className="text-muted-foreground"
    >
      <Bell />
    </Button>
  );
}
