import api from './api';
import type { ApiResponse, DashboardStats, DashboardAlert } from '@/types';

export async function getDashboardStats(period: 'day' | 'week' | 'month' = 'month') {
  const res = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats', {
    params: { period },
  });
  return res.data.data;
}

export async function getDashboardAlert() {
  const res = await api.get<ApiResponse<DashboardAlert>>('/dashboard/alert');
  return res.data.data;
}
