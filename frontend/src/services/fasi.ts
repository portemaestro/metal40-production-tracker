import api from './api';
import type { ApiResponse, FaseProduzione } from '@/types';

export interface ListFasiMieParams {
  completate?: 'true' | 'false';
}

export interface CompleteFaseData {
  note?: string;
  foto_paths?: string[];
}

export async function getFasiMie(params: ListFasiMieParams = {}) {
  const res = await api.get<ApiResponse<FaseProduzione[]>>('/fasi/mie', { params });
  return res.data.data;
}

export async function getFasiOrdine(ordineId: number) {
  const res = await api.get<ApiResponse<FaseProduzione[]>>(`/fasi/ordine/${ordineId}`);
  return res.data.data;
}

export async function completeFase(id: number, data: CompleteFaseData = {}) {
  const res = await api.post<ApiResponse<FaseProduzione>>(`/fasi/${id}/completa`, data);
  return res.data.data;
}
