import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { getTokenExpiry, refreshTokenApi } from '@/services/api';

const REFRESH_BEFORE_MS = 30 * 60 * 1000; // Rinnova 30 minuti prima della scadenza
const CHECK_INTERVAL_MS = 60 * 1000; // Controlla ogni minuto
const WARNING_BEFORE_MS = 5 * 60 * 1000; // Avviso 5 minuti prima

export function useTokenRefresh() {
  const token = useAuthStore((s) => s.token);
  const setToken = useAuthStore((s) => s.setToken);
  const logout = useAuthStore((s) => s.logout);
  const [showExpiryWarning, setShowExpiryWarning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkAndRefresh = useCallback(async () => {
    if (!token) return;

    const expiry = getTokenExpiry(token);
    if (!expiry) return;

    const now = Date.now();
    const timeLeft = expiry - now;

    // Token gia' scaduto
    if (timeLeft <= 0) {
      logout();
      return;
    }

    // Mostra avviso se meno di 5 minuti
    if (timeLeft <= WARNING_BEFORE_MS) {
      setShowExpiryWarning(true);
    }

    // Rinnova se meno di 30 minuti alla scadenza
    if (timeLeft <= REFRESH_BEFORE_MS) {
      const newToken = await refreshTokenApi();
      if (newToken) {
        setToken(newToken);
        setShowExpiryWarning(false);
      } else {
        // Refresh fallito, mostra avviso
        setShowExpiryWarning(true);
      }
    }
  }, [token, setToken, logout]);

  useEffect(() => {
    if (!token) {
      setShowExpiryWarning(false);
      return;
    }

    // Controlla subito
    checkAndRefresh();

    // Poi ogni minuto
    intervalRef.current = setInterval(checkAndRefresh, CHECK_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [token, checkAndRefresh]);

  const dismissWarning = useCallback(() => {
    setShowExpiryWarning(false);
  }, []);

  return { showExpiryWarning, dismissWarning };
}
