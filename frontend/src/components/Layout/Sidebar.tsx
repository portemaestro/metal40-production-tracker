import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, Boxes, AlertTriangle, X, ClipboardList, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const UFFICIO_NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/ordini', label: 'Ordini', icon: Package },
  { to: '/materiali', label: 'Materiali', icon: Boxes },
  { to: '/problemi', label: 'Problemi', icon: AlertTriangle },
  { to: '/admin/utenti', label: 'Gestione Utenti', icon: Users },
];

const OPERATORE_NAV: NavItem[] = [
  { to: '/', label: 'Le mie fasi', icon: ClipboardList },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuth();

  const navItems = user?.ruolo === 'operatore' ? OPERATORE_NAV : UFFICIO_NAV;

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-background transition-transform duration-200 md:static md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile close button */}
        <div className="flex h-16 items-center justify-between border-b px-4 md:hidden">
          <span className="font-semibold">Menu</span>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-muted-foreground hover:bg-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
              {user?.nome?.[0]}{user?.cognome?.[0]}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user?.nome} {user?.cognome}</span>
              <span className="text-xs text-muted-foreground capitalize">{user?.ruolo}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
