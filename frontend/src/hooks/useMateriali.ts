import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMaterialiDaOrdinare, getMaterialiOrdine, ordinaMateriale, arrivoMateriale } from '@/services/materiali';
import type { OrdinaMaterialeData, ArrivoMaterialeData } from '@/services/materiali';

export function useMaterialiDaOrdinare() {
  return useQuery({
    queryKey: ['materiali', 'da-ordinare'],
    queryFn: getMaterialiDaOrdinare,
  });
}

export function useMaterialiOrdine(ordineId: number) {
  return useQuery({
    queryKey: ['materiali', 'ordine', ordineId],
    queryFn: () => getMaterialiOrdine(ordineId),
    enabled: ordineId > 0,
  });
}

export function useOrdinaMateriale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: OrdinaMaterialeData }) => ordinaMateriale(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiali'] });
      queryClient.invalidateQueries({ queryKey: ['ordini'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useArrivoMateriale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ArrivoMaterialeData }) => arrivoMateriale(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiali'] });
      queryClient.invalidateQueries({ queryKey: ['ordini'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
