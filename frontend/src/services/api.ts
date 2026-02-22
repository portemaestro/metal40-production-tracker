import axios from 'axios';
import type { LoginRequest, LoginResponse, ApiResponse, User, LoginUser } from '@/types';
import { API_BASE_URL, TOKEN_KEY } from '@/utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
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

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

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

export default api;
