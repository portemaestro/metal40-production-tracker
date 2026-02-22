export const ORDINE_STATI = ['in_produzione', 'bloccato', 'pronto_spedizione', 'spedito'] as const;
export type OrdineStato = (typeof ORDINE_STATI)[number];

export const FASE_STATI = ['da_fare', 'completata'] as const;
export type FaseStato = (typeof FASE_STATI)[number];

export const PROBLEMA_GRAVITA = ['bassa', 'media', 'alta_bloccante'] as const;
export type ProblemaGravita = (typeof PROBLEMA_GRAVITA)[number];

export const TIPI_PROBLEMA = [
  'Materiale difettoso',
  'Misure non corrispondenti',
  'Macchinario guasto',
  'Manca materiale',
  'Altro',
] as const;
export type TipoProblema = (typeof TIPI_PROBLEMA)[number];

export const REPARTI = [
  'punzonatura_dalcos',
  'punzonatura_euromac',
  'piegatura',
  'saldatura_assemblaggio',
  'rivestimento',
  'imballaggio',
  'magazzino_ricezione',
] as const;
export type Reparto = (typeof REPARTI)[number];

export const TIPI_TELAIO = [
  'standard_falsotelaio',
  'ristrutturazione_l',
  'ristrutturazione_z',
  'falsotelaio_non_nostro',
] as const;
export type TipoTelaio = (typeof TIPI_TELAIO)[number];

export const TIPI_MATERIALE = [
  'pannello_esterno',
  'pannello_interno_speciale',
  'mostrine',
  'kit_imbotte',
  'vetro',
  'maniglione',
] as const;
export type TipoMateriale = (typeof TIPI_MATERIALE)[number];

export const SOTTOTIPI_PANNELLO = ['okoume', 'mdf', 'pvc', 'alluminio', 'laminato'] as const;
export type SottotipoPannello = (typeof SOTTOTIPI_PANNELLO)[number];

// Colori standard che NON richiedono verniciatura
export const COLORI_STANDARD = ['marrone', 'bianco'] as const;

// Giorni di consegna per tipo materiale/sottotipo
export const GIORNI_CONSEGNA: Record<string, number> = {
  'pannello_esterno:okoume': 30,
  'pannello_esterno:mdf': 30,
  'pannello_esterno:pvc': 40,
  'pannello_esterno:alluminio': 40,
  'mostrine:okoume': 20,
  'mostrine:mdf': 20,
  'kit_imbotte': 20,
  'vetro': 20,
  'maniglione': 20,
};

// Fasi produzione (in ordine logico)
export const FASI_PRODUZIONE = [
  'punzonatura_dalcos',
  'punzonatura_euromac',
  'piegatura',
  'saldatura_assemblaggio',
  'verniciatura',
  'rivestimento',
  'imballaggio',
] as const;
