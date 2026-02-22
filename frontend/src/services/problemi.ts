import api from './api';
import type { ApiResponse, PaginatedResponse, Problema } from '@/types';

export interface ListProblemiParams {
  page?: number;
  limit?: number;
  risolto?: 'true' | 'false' | 'all';
  gravita?: string;
  ordine_id?: number;
}

export interface SegnalaProblemaData {
  fase?: string;
  tipo_problema: string;
  descrizione: string;
  gravita: string;
  foto_paths?: string[];
}

export interface RisolviProblemaData {
  descrizione_risoluzione: string;
  foto_risoluzione_paths?: string[];
}

export async function listProblemi(params: ListProblemiParams = {}) {
  const res = await api.get<PaginatedResponse<Problema>>('/problemi', { params });
  return res.data;
}

export async function getProblema(id: number) {
  const res = await api.get<ApiResponse<Problema>>(`/problemi/${id}`);
  return res.data.data;
}

export async function segnalaProblema(ordineId: number, data: SegnalaProblemaData) {
  const res = await api.post<ApiResponse<Problema>>(`/problemi/ordine/${ordineId}`, data);
  return res.data.data;
}

export async function risolviProblema(id: number, data: RisolviProblemaData) {
  const res = await api.put<ApiResponse<Problema>>(`/problemi/${id}/risolvi`, data);
  return res.data.data;
}
