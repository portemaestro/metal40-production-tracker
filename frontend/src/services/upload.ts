import api from './api';
import type { ApiResponse } from '@/types';

export interface ExtractedOrderData {
  numero_conferma: string;
  cliente: string;
  tipo_telaio: string;
  colore_telaio_esterno: string;
  colore_telaio_interno: string;
  pannello_esterno_tipo: string;
  pannello_esterno_colore: string;
  pannello_interno_tipo: string;
  pannello_interno_colore: string;
  mostrine: string;
  kit_imbotte: string;
  vetro: string;
  maniglione: string;
  note: string;
  consegna_anticipata_ft: boolean;
  tipo_consegna_ft: string;
  data_consegna_ft: string;
}

export interface PdfUploadResponse {
  pdf_url: string;
  pdf_key: string;
  extracted_data: ExtractedOrderData | null;
  ai_success: boolean;
}

export async function uploadPdf(file: File) {
  const formData = new FormData();
  formData.append('pdf', file);
  const res = await api.post<ApiResponse<PdfUploadResponse>>('/upload/pdf', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}

export async function uploadFoto(file: File) {
  const formData = new FormData();
  formData.append('foto', file);
  const res = await api.post<ApiResponse<{ file_url: string }>>('/upload/foto', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}
