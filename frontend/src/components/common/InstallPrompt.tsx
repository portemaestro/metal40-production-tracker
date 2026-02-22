import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa_install_dismissed';
const DISMISS_DAYS = 7;

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if already dismissed recently
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const dismissedAt = new Date(dismissed).getTime();
      const now = Date.now();
      if (now - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, new Date().toISOString());
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-lg border bg-white p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-slate-100 p-2">
          <Download className="h-5 w-5 text-slate-700" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">Installa Metal 4.0</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Aggiungi alla schermata Home per accesso rapido
          </p>
        </div>
        <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={handleInstall} className="flex-1">
          Installa
        </Button>
        <Button size="sm" variant="outline" onClick={handleDismiss} className="flex-1">
          Non ora
        </Button>
      </div>
    </div>
  );
}
