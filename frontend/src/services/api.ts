import axios from 'axios';
import type { LoginRequest, LoginResponse, ApiResponse, User, LoginUser, AdminUser, CreateUserRequest, UpdateUserRequest } from '@/types';
import { API_BASE_URL, TOKEN_KEY } from '@/utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Fix 6: timeout 15 secondi
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Fix 7: Retry automatico per errori di rete e 503
api.interceptors.response.use(undefined, async (error) => {
  const config = error.config;
  if (!config) return Promise.reject(error);

  // Retry solo per errori di rete (no response) o 503/408
  const isRetryable = !error.response || [503, 408].includes(error.response?.status);
  // Non ritentare POST/PUT/DELETE per evitare duplicati (solo GET)
  const isSafeMethod = !config.method || config.method.toUpperCase() === 'GET';

  if (!isRetryable || !isSafeMethod) return Promise.reject(error);

  config._retryCount = config._retryCount || 0;
  if (config._retryCount >= 2) return Promise.reject(error);

  config._retryCount += 1;
  const delay = config._retryCount * 1000; // 1s, 2s
  await new Promise(resolve => setTimeout(resolve, delay));
  return api(config);
});

// Flag per evitare refresh multipli contemporanei
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function tryRefreshToken(): Promise<string | null> {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  try {
    const response = await axios.post<ApiResponse<{ token: string }>>(
      `${API_BASE_URL}/auth/refresh`,
      {},
      { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
    );
    const newToken = response.data.data.token;
    localStorage.setItem(TOKEN_KEY, newToken);
    return newToken;
  } catch {
    return null;
  }
}

// Response interceptor: handle 401 con tentativo di refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se 401 e non e' gia' un retry, prova il refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Non fare refresh su endpoint di login/refresh
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // Evita refresh multipli contemporanei
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = tryRefreshToken();
      }

      const newToken = await refreshPromise;
      isRefreshing = false;
      refreshPromise = null;

      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }

      // Refresh fallito: redirect al login
      localStorage.removeItem(TOKEN_KEY);
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Token utils
export function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null; // ms
  } catch {
    return null;
  }
}

export async function refreshTokenApi(): Promise<string | null> {
  return tryRefreshToken();
}

// Auth API
export async function getUsersApi(): Promise<ApiResponse<{ users: LoginUser[] }>> {
  const response = await api.get<ApiResponse<{ users: LoginUser[] }>>('/auth/users');
  return response.data;
}

export async function loginApi(data: LoginRequest): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', data);
  return response.data;
}

export async function getMeApi(): Promise<ApiResponse<{ user: User }>> {
  const response = await api.get<ApiResponse<{ user: User }>>('/auth/me');
  return response.data;
}

export async function logoutApi(): Promise<void> {
  await api.post('/auth/logout');
}

// Admin API
export async function getAdminUsers(): Promise<ApiResponse<{ users: AdminUser[] }>> {
  const response = await api.get<ApiResponse<{ users: AdminUser[] }>>('/admin/users');
  return response.data;
}

export async function createUserApi(data: CreateUserRequest): Promise<ApiResponse<{ user: AdminUser }>> {
  const response = await api.post<ApiResponse<{ user: AdminUser }>>('/admin/users', data);
  return response.data;
}

export async function updateUserApi(id: number, data: UpdateUserRequest): Promise<ApiResponse<{ user: AdminUser }>> {
  const response = await api.put<ApiResponse<{ user: AdminUser }>>(`/admin/users/${id}`, data);
  return response.data;
}

export async function deleteUserApi(id: number): Promise<ApiResponse<null>> {
  const response = await api.delete<ApiResponse<null>>(`/admin/users/${id}`);
  return response.data;
}

export default api;
