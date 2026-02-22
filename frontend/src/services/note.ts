import api from './api';
import type { ApiResponse, PaginatedResponse, Nota } from '@/types';

export interface CreaNotaData {
  testo: string;
  foto_paths?: string[];
}

export async function listNote(ordineId: number, params: { page?: number; limit?: number } = {}) {
  const res = await api.get<PaginatedResponse<Nota>>(`/note/ordine/${ordineId}`, { params });
  return res.data;
}

export async function creaNota(ordineId: number, data: CreaNotaData) {
  const res = await api.post<ApiResponse<Nota>>(`/note/ordine/${ordineId}`, data);
  return res.data.data;
}
