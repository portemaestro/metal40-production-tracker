import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <button
        onClick={onToggleSidebar}
        className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
          M4
        </div>
        <span className="text-lg font-semibold hidden sm:inline-block">Metal 4.0</span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <NotificationDropdown />

        <div className="hidden sm:flex items-center gap-2 text-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-xs">
            {user?.nome?.[0]}{user?.cognome?.[0]}
          </div>
          <div className="flex flex-col">
            <span className="font-medium leading-none">{user?.nome} {user?.cognome}</span>
            <span className="text-xs text-muted-foreground capitalize">{user?.ruolo}</span>
          </div>
        </div>

        <button
          onClick={logout}
          className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          title="Esci"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
