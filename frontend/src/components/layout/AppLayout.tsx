import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Logo } from './Logo';
import { NotificationsButton } from './NotificationsButton';
import { SidebarContent } from './Sidebar';

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen w-full md:pl-60">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r bg-card md:flex">
        <div className="flex items-center justify-between px-5 pb-2 pt-6">
          <Logo />
          <NotificationsButton />
        </div>
        <SidebarContent />
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card px-4 md:hidden">
        <Button variant="ghost" size="icon" onClick={() => setMenuOpen(true)} aria-label="Abrir menu">
          <Menu />
        </Button>
        <Logo />
        <NotificationsButton />
      </header>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="flex w-72 max-w-[85vw] flex-col gap-0 bg-card p-0">
          <div className="px-5 pb-2 pt-6">
            <SheetTitle asChild>
              <div>
                <Logo />
              </div>
            </SheetTitle>
            <SheetDescription className="sr-only">Navegação principal</SheetDescription>
          </div>
          <SidebarContent onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <Outlet />
    </div>
  );
}
