import { useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { loginApi, logoutApi, getMeApi } from '@/services/api';

export function useAuth() {
  const { user, token, isLoading, error, setUser, setToken, setLoading, setError, logout: clearAuth, clearError } = useAuthStore();

  const isAuthenticated = !!token && !!user;

  const login = useCallback(async (email: string, pin: string) => {
    setLoading(true);
    clearError();
    try {
      const response = await loginApi({ email, pin });
      setToken(response.data.token);
      setUser(response.data.user);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message || 'Errore di connessione al server';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, clearError, setToken, setUser, setError]);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Logout even if API call fails
    }
    clearAuth();
  }, [clearAuth]);

  const restoreSession = useCallback(async () => {
    if (!token) return false;
    setLoading(true);
    try {
      const response = await getMeApi();
      setUser(response.data.user);
      return true;
    } catch {
      clearAuth();
      return false;
    } finally {
      setLoading(false);
    }
  }, [token, setLoading, setUser, clearAuth]);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    restoreSession,
    clearError,
  };
}
