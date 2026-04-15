import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, getDashboardAlert } from '@/services/dashboard';

export function useDashboardStats(period: 'day' | 'week' | 'month' = 'month') {
  return useQuery({
    queryKey: ['dashboard', 'stats', period],
    queryFn: () => getDashboardStats(period),
    staleTime: 30000, // 30 secondi prima di considerare i dati stale
    refetchInterval: 60000,
  });
}

export function useDashboardAlert() {
  return useQuery({
    queryKey: ['dashboard', 'alert'],
    queryFn: getDashboardAlert,
    staleTime: 30000,
  });
}
