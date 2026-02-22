export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const RUOLI = {
  UFFICIO: 'ufficio',
  OPERATORE: 'operatore',
} as const;

export const REPARTI = {
  PUNZONATURA_DALCOS: 'punzonatura_dalcos',
  PUNZONATURA_EUROMAC: 'punzonatura_euromac',
  PIEGATURA: 'piegatura',
  SALDATURA_ASSEMBLAGGIO: 'saldatura_assemblaggio',
  RIVESTIMENTO: 'rivestimento',
  IMBALLAGGIO: 'imballaggio',
  VERNICIATURA: 'verniciatura',
} as const;

export const REPARTI_LABELS: Record<string, string> = {
  punzonatura_dalcos: 'Punzonatura Dalcos',
  punzonatura_euromac: 'Punzonatura Euromac',
  piegatura: 'Piegatura',
  saldatura_assemblaggio: 'Saldatura/Assemblaggio',
  rivestimento: 'Rivestimento',
  imballaggio: 'Imballaggio',
  verniciatura: 'Verniciatura',
};

export const STATI_ORDINE = {
  IN_PRODUZIONE: 'in_produzione',
  BLOCCATO: 'bloccato',
  PRONTO_SPEDIZIONE: 'pronto_spedizione',
  SPEDITO: 'spedito',
} as const;

export const STATI_ORDINE_LABELS: Record<string, string> = {
  in_produzione: 'In Produzione',
  bloccato: 'Bloccato',
  pronto_spedizione: 'Pronto Spedizione',
  spedito: 'Spedito',
};

export const GRAVITA_LABELS: Record<string, string> = {
  bassa: 'Bassa',
  media: 'Media',
  alta_bloccante: 'Alta (Bloccante)',
};

export const TIPI_TELAIO_LABELS: Record<string, string> = {
  standard_falsotelaio: 'Standard con Falsotelaio',
  ristrutturazione_l: 'Ristrutturazione L',
  ristrutturazione_z: 'Ristrutturazione Z',
  falsotelaio_non_nostro: 'Falsotelaio Non Nostro',
};

export const TIPI_PROBLEMA = [
  'Materiale difettoso',
  'Misure non corrispondenti',
  'Macchinario guasto',
  'Manca materiale',
  'Altro',
] as const;

export const TIPI_MATERIALE_LABELS: Record<string, string> = {
  pannello: 'Pannello',
  mostrina: 'Mostrina',
  vetro: 'Vetro',
  maniglione: 'Maniglione',
  serratura: 'Serratura',
  cilindro: 'Cilindro',
  spioncino: 'Spioncino',
  laminato: 'Laminato',
  altro: 'Altro',
};

export const TOKEN_KEY = 'metal40_token';
