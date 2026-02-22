import { create } from 'zustand';
import type { AuthStore } from '@/types/auth';
import { TOKEN_KEY } from '@/utils/constants';

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: localStorage.getItem(TOKEN_KEY),
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),

  setToken: (token) => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
    set({ token });
  },

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ user: null, token: null, error: null });
  },

  clearError: () => set({ error: null }),
}));
