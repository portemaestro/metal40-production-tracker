import { useNavigate } from 'react-router-dom';
import {
  Bell,
  AlertTriangle,
  Package,
  CheckCircle2,
  ShieldCheck,
  Trash2,
  CheckCheck,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAuthStore } from '@/stores/authStore';
import type { AppNotification, SocketEventType } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

const EVENT_CONFIG: Record<SocketEventType, { icon: typeof Bell; color: string }> = {
  problema_segnalato: { icon: AlertTriangle, color: 'text-destructive' },
  materiale_arrivato: { icon: Package, color: 'text-blue-600' },
  fase_completata: { icon: CheckCircle2, color: 'text-green-600' },
  problema_risolto: { icon: ShieldCheck, color: 'text-emerald-600' },
};

function NotificationItem({
  notification,
  onNavigate,
}: {
  notification: AppNotification;
  onNavigate: (ordineId: number) => void;
}) {
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const config = EVENT_CONFIG[notification.type];
  const Icon = config.icon;
  const isBloccante = notification.gravita === 'alta_bloccante';

  function handleClick() {
    markAsRead(notification.id);
    onNavigate(notification.ordine_id);
  }

  let timeAgo: string;
  try {
    timeAgo = formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true, locale: it });
  } catch {
    timeAgo = '';
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left px-3 py-2.5 hover:bg-accent transition-colors flex gap-3 items-start ${
        !notification.read ? 'bg-accent/40' : ''
      } ${isBloccante ? 'border-l-2 border-destructive' : ''}`}
    >
      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${config.color}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-tight ${!notification.read ? 'font-semibold' : 'font-medium'}`}>
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {notification.message}
        </p>
        {timeAgo && (
          <p className="text-[10px] text-muted-foreground/70 mt-1">{timeAgo}</p>
        )}
      </div>
      {!notification.read && (
        <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
      )}
    </button>
  );
}

export function NotificationDropdown() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const notifications = useNotificationStore((s) => s.notifications);
  const isConnected = useNotificationStore((s) => s.isConnected);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const clearAll = useNotificationStore((s) => s.clearAll);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function handleNavigate(ordineId: number) {
    if (user?.ruolo === 'ufficio') {
      navigate(`/ordini/${ordineId}`);
    } else {
      navigate(`/ordine/${ordineId}`);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          {!isConnected && (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-yellow-500">
              <WifiOff className="h-2 w-2 text-white" />
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Notifiche</span>
            {isConnected ? (
              <Wifi className="h-3 w-3 text-green-500" />
            ) : (
              <WifiOff className="h-3 w-3 text-yellow-500" />
            )}
          </div>
          {notifications.length > 0 && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={markAllAsRead}
                title="Segna tutte come lette"
              >
                <CheckCheck className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                onClick={clearAll}
                title="Cancella tutte"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Notification list */}
        {notifications.length === 0 ? (
          <div className="p-6 text-center">
            <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nessuna notifica</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[360px]">
            {notifications.map((n, i) => (
              <div key={n.id}>
                <NotificationItem notification={n} onNavigate={handleNavigate} />
                {i < notifications.length - 1 && <Separator />}
              </div>
            ))}
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
