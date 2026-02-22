import { Request } from 'express';
import { addDays } from 'date-fns';
import { GIORNI_CONSEGNA } from '../constants';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export function getPaginationParams(req: Request): PaginationParams {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function createPaginationMeta(page: number, limit: number, total: number) {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages,
  };
}

/**
 * Calcola la data di consegna prevista in base al tipo e sottotipo materiale.
 * Restituisce null per materiali "laminato" (a magazzino, non tracciati).
 */
export function calcolaDataConsegnaPrevista(
  tipoMateriale: string,
  sottotipo: string | null,
  dataOrdine: Date,
): Date | null {
  if (sottotipo === 'laminato') return null;

  const key = sottotipo ? `${tipoMateriale}:${sottotipo}` : tipoMateriale;
  const giorni = GIORNI_CONSEGNA[key] ?? 30;
  return addDays(dataOrdine, giorni);
}

/**
 * Verifica se un colore richiede verniciatura (non standard).
 */
export function richiedeVerniciatura(coloreEsterno: string | null, coloreInterno: string | null): boolean {
  const standard = ['marrone', 'bianco'];
  const esternoNonStandard = coloreEsterno ? !standard.includes(coloreEsterno.toLowerCase()) : false;
  const internoNonStandard = coloreInterno ? !standard.includes(coloreInterno.toLowerCase()) : false;
  return esternoNonStandard || internoNonStandard;
}
