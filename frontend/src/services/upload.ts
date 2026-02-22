import api from './api';
import type { ApiResponse } from '@/types';

export async function uploadPdf(file: File) {
  const formData = new FormData();
  formData.append('pdf', file);
  const res = await api.post<ApiResponse<{ file_url: string; extracted_data: unknown }>>('/upload/pdf', formData, {
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
