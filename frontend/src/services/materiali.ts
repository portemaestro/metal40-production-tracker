import api from './api';
import type { ApiResponse, Materiale } from '@/types';

export interface MaterialiDaOrdinareResponse {
  totale: number;
  ordini: Array<{
    ordine_id: number;
    numero_conferma: string;
    cliente: string;
    urgente: boolean;
    data_tassativa: string | null;
    materiali: Materiale[];
  }>;
}

export interface OrdinaMaterialeData {
  data_ordine_effettivo: string;
  data_consegna_prevista: string;
  note?: string;
}

export interface ArrivoMaterialeData {
  data_arrivo_effettivo: string;
  note?: string;
}

export async function getMaterialiDaOrdinare() {
  const res = await api.get<ApiResponse<MaterialiDaOrdinareResponse>>('/materiali/da-ordinare');
  return res.data.data;
}

export async function getMaterialiOrdine(ordineId: number) {
  const res = await api.get<ApiResponse<Materiale[]>>(`/materiali/ordine/${ordineId}`);
  return res.data.data;
}

export async function updateMateriale(id: number, data: { note?: string; misure?: string; data_consegna_prevista?: string }) {
  const res = await api.put<ApiResponse<Materiale>>(`/materiali/${id}`, data);
  return res.data.data;
}

export async function ordinaMateriale(id: number, data: OrdinaMaterialeData) {
  const res = await api.post<ApiResponse<Materiale>>(`/materiali/${id}/ordina`, data);
  return res.data.data;
}

export async function arrivoMateriale(id: number, data: ArrivoMaterialeData) {
  const res = await api.post<ApiResponse<Materiale>>(`/materiali/${id}/arrivato`, data);
  return res.data.data;
}
