import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, getDashboardAlert } from '@/services/dashboard';

export function useDashboardStats(period: 'day' | 'week' | 'month' = 'month') {
  return useQuery({
    queryKey: ['dashboard', 'stats', period],
    queryFn: () => getDashboardStats(period),
    refetchInterval: 60000,
  });
}

export function useDashboardAlert() {
  return useQuery({
    queryKey: ['dashboard', 'alert'],
    queryFn: getDashboardAlert,
  });
}
