import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFasiMie, getFasiOrdine, completeFase } from '@/services/fasi';
import type { ListFasiMieParams, CompleteFaseData } from '@/services/fasi';

export function useFasiMie(params: ListFasiMieParams = {}) {
  return useQuery({
    queryKey: ['fasi', 'mie', params],
    queryFn: () => getFasiMie(params),
  });
}

export function useFasiOrdine(ordineId: number) {
  return useQuery({
    queryKey: ['fasi', 'ordine', ordineId],
    queryFn: () => getFasiOrdine(ordineId),
    enabled: ordineId > 0,
  });
}

export function useCompleteFase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: CompleteFaseData }) =>
      completeFase(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fasi'] });
      queryClient.invalidateQueries({ queryKey: ['ordini'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
