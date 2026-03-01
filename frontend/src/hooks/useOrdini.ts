import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listOrdini, getOrdine, createOrdine, updateOrdine, deleteOrdine, markFtPreparato, markFtConsegnato } from '@/services/ordini';
import type { ListOrdiniParams, CreateOrdineData, UpdateOrdineData } from '@/services/ordini';

export function useOrdini(params: ListOrdiniParams = {}) {
  return useQuery({
    queryKey: ['ordini', params],
    queryFn: () => listOrdini(params),
  });
}

export function useOrdine(id: number) {
  return useQuery({
    queryKey: ['ordini', id],
    queryFn: () => getOrdine(id),
    enabled: id > 0,
  });
}

export function useCreateOrdine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOrdineData) => createOrdine(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordini'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateOrdine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateOrdineData }) => updateOrdine(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ordini'] });
      queryClient.invalidateQueries({ queryKey: ['ordini', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteOrdine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteOrdine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordini'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useMarkFtPreparato() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => markFtPreparato(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ordini'] });
      queryClient.invalidateQueries({ queryKey: ['ordini', data.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['fasi'] });
    },
  });
}

export function useMarkFtConsegnato() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => markFtConsegnato(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ordini'] });
      queryClient.invalidateQueries({ queryKey: ['ordini', data.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
