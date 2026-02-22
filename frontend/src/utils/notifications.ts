/**
 * Browser Notification API helpers for PWA
 */

export function requestNotificationPermission(): void {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        localStorage.setItem('notifications_enabled', 'true');
      }
    });
  }
}

export function showBrowserNotification(
  title: string,
  message: string,
  tag: string,
  requireInteraction = false,
): void {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  new Notification(title, {
    body: message,
    icon: '/logo-192.png',
    tag, // prevents duplicate notifications
    requireInteraction,
  });
}
