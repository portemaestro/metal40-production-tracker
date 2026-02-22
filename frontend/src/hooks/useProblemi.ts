import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listProblemi, segnalaProblema, risolviProblema } from '@/services/problemi';
import type { ListProblemiParams, SegnalaProblemaData, RisolviProblemaData } from '@/services/problemi';

export function useProblemi(params: ListProblemiParams = {}) {
  return useQuery({
    queryKey: ['problemi', params],
    queryFn: () => listProblemi(params),
  });
}

export function useSegnalaProblema() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ordineId, data }: { ordineId: number; data: SegnalaProblemaData }) =>
      segnalaProblema(ordineId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problemi'] });
      queryClient.invalidateQueries({ queryKey: ['ordini'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useRisolviProblema() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: RisolviProblemaData }) =>
      risolviProblema(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problemi'] });
      queryClient.invalidateQueries({ queryKey: ['ordini'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
