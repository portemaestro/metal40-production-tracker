import api from './api';
import type { ApiResponse, PaginatedResponse, Ordine } from '@/types';

export interface ListOrdiniParams {
  page?: number;
  limit?: number;
  stato?: string;
  urgente?: string;
  search?: string;
}

export interface CreateOrdineData {
  numero_conferma: string;
  cliente: string;
  riferimento?: string | null;
  data_ordine: string;
  quantita_porte?: number;
  tipo_telaio: string;
  colore_telaio_interno?: string | null;
  colore_telaio_esterno?: string | null;
  verniciatura_necessaria?: boolean;
  urgente?: boolean;
  data_tassativa?: string | null;
  pdf_path?: string | null;
  note_generali?: string | null;
}

export interface UpdateOrdineData {
  cliente?: string;
  riferimento?: string | null;
  data_ordine?: string;
  quantita_porte?: number;
  tipo_telaio?: string;
  colore_telaio_interno?: string | null;
  colore_telaio_esterno?: string | null;
  verniciatura_necessaria?: boolean;
  urgente?: boolean;
  data_tassativa?: string | null;
  note_generali?: string | null;
  stato?: string;
}

export async function listOrdini(params: ListOrdiniParams = {}) {
  const res = await api.get<PaginatedResponse<Ordine>>('/ordini', { params });
  return res.data;
}

export async function getOrdine(id: number) {
  const res = await api.get<ApiResponse<Ordine>>(`/ordini/${id}`);
  return res.data.data;
}

export async function createOrdine(data: CreateOrdineData) {
  const res = await api.post<ApiResponse<Ordine>>('/ordini', data);
  return res.data.data;
}

export async function updateOrdine(id: number, data: UpdateOrdineData) {
  const res = await api.put<ApiResponse<Ordine>>(`/ordini/${id}`, data);
  return res.data.data;
}

export async function deleteOrdine(id: number) {
  const res = await api.delete<ApiResponse<null>>(`/ordini/${id}`);
  return res.data;
}
