import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listNote, creaNota } from '@/services/note';
import type { CreaNotaData } from '@/services/note';

export function useNote(ordineId: number, params: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ['note', ordineId, params],
    queryFn: () => listNote(ordineId, params),
    enabled: ordineId > 0,
  });
}

export function useCreaNota() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ordineId, data }: { ordineId: number; data: CreaNotaData }) =>
      creaNota(ordineId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['note', variables.ordineId] });
      queryClient.invalidateQueries({ queryKey: ['ordini', variables.ordineId] });
    },
  });
}
