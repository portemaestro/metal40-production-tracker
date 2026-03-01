export type UserRole = 'ufficio' | 'operatore';

export interface User {
  id: number;
  email: string;
  nome: string;
  cognome: string;
  ruolo: UserRole;
  reparti: string[];
  attivo: boolean;
}

export interface LoginUser {
  id: number;
  nome: string;
  cognome: string;
  email: string;
  ruolo: UserRole;
}

export interface LoginRequest {
  email: string;
  pin: string;
}

export interface LoginResponse {
  success: true;
  data: {
    token: string;
    user: User;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// Ordine types
export type StatoOrdine = 'in_produzione' | 'bloccato' | 'pronto_spedizione' | 'spedito';
export type TipoTelaio = 'standard_falsotelaio' | 'ristrutturazione_l' | 'ristrutturazione_z' | 'falsotelaio_non_nostro';
export type StatoFase = 'da_fare' | 'completata';
export type GravitaProblema = 'bassa' | 'media' | 'alta_bloccante';

export interface Ordine {
  id: number;
  numero_conferma: string;
  cliente: string;
  riferimento: string | null;
  data_ordine: string;
  quantita_porte: number;
  tipo_telaio: TipoTelaio;
  colore_telaio_interno: string | null;
  colore_telaio_esterno: string | null;
  verniciatura_necessaria: boolean;
  data_invio_verniciatura: string | null;
  data_rientro_verniciatura: string | null;
  urgente: boolean;
  data_tassativa: string | null;
  pdf_path: string | null;
  stato: StatoOrdine;
  note_generali: string | null;
  // Consegna anticipata falsotelaio
  consegna_anticipata_ft: boolean;
  data_consegna_ft: string | null;
  tipo_consegna_ft: string | null;
  ft_preparato: boolean;
  ft_preparato_da: number | null;
  user_ft_preparato?: Pick<User, 'id' | 'nome' | 'cognome'> | null;
  data_preparazione_ft: string | null;
  ft_consegnato: boolean;
  ft_consegnato_da: number | null;
  user_ft_consegnato?: Pick<User, 'id' | 'nome' | 'cognome'> | null;
  data_consegna_effettiva_ft: string | null;
  created_at: string;
  updated_at: string;
  materiali?: Materiale[];
  fasi?: FaseProduzione[];
  problemi?: Problema[];
  note?: Nota[];
  _count?: {
    fasi: number;
    problemi: number;
    materiali: number;
  };
}

export interface Materiale {
  id: number;
  ordine_id: number;
  tipo_materiale: string;
  sottotipo: string | null;
  necessario: boolean;
  note: string | null;
  misure: string | null;
  data_ordine_effettivo: string | null;
  data_consegna_prevista: string | null;
  data_arrivo_effettivo: string | null;
  ordine_effettuato: boolean;
  arrivato: boolean;
  created_at: string;
  updated_at: string;
  ordine?: Ordine;
}

export interface FaseProduzione {
  id: number;
  ordine_id: number;
  nome_fase: string;
  stato: StatoFase;
  completata_da: number | null;
  data_completamento: string | null;
  note: string | null;
  foto_paths: string[] | null;
  created_at: string;
  ordine?: Ordine;
  user?: Pick<User, 'id' | 'nome' | 'cognome'>;
}

export interface Problema {
  id: number;
  ordine_id: number;
  fase: string | null;
  tipo_problema: string;
  descrizione: string;
  gravita: GravitaProblema;
  segnalato_da: number;
  data_segnalazione: string;
  foto_segnalazione_paths: string[] | null;
  risolto: boolean;
  risolto_da: number | null;
  data_risoluzione: string | null;
  descrizione_risoluzione: string | null;
  foto_risoluzione_paths: string[] | null;
  created_at: string;
  ordine?: Pick<Ordine, 'id' | 'numero_conferma' | 'cliente' | 'tipo_telaio' | 'urgente' | 'data_tassativa' | 'stato'>;
  user_segnalatore?: Pick<User, 'id' | 'nome' | 'cognome'>;
  user_risolutore?: Pick<User, 'id' | 'nome' | 'cognome'>;
}

export interface Nota {
  id: number;
  ordine_id: number;
  testo: string;
  foto_paths: string[] | null;
  creato_da: number;
  created_at: string;
  user?: Pick<User, 'id' | 'nome' | 'cognome'>;
}

// Dashboard types
export interface DashboardStats {
  kpi: {
    in_produzione: number;
    urgenti: number;
    problemi_aperti: number;
    pronte_spedizione: number;
    ft_in_attesa: number;
  };
  dettagli: {
    ordini_stato: Record<string, number>;
    problemi_per_gravita: Record<string, number>;
    materiali: {
      da_ordinare: number;
      ordinati_in_attesa: number;
      arrivati: number;
    };
    tempi: {
      tempo_medio_produzione_giorni: number | null;
      ordini_in_ritardo: number;
      tempo_medio_risoluzione_problemi_ore: number | null;
    };
  };
  timestamp: string;
}

export interface AlertMaterialiOrdine {
  ordine_id: number;
  numero_conferma: string;
  cliente: string;
  riferimento: string | null;
  materiali: Array<{
    materiale_id: number;
    tipo_materiale: string;
    sottotipo: string | null;
    necessario: boolean;
    ordine_effettuato: boolean;
    arrivato: boolean;
  }>;
}

export interface AlertProblema {
  problema_id: number;
  ordine_id: number;
  numero_conferma: string;
  cliente: string;
  fase: string | null;
  gravita: string;
  tipo_problema: string;
  descrizione: string;
  segnalato_da_nome: string;
  data_segnalazione: string;
  ore_aperto: number;
}

export interface AlertMaterialeArrivo {
  ordine_id: number;
  numero_conferma: string;
  cliente: string;
  materiale_id: number;
  tipo_materiale: string;
  sottotipo: string | null;
  data_consegna_prevista: string;
  giorni_mancanti: number;
  arrivato: boolean;
}

export interface AlertFtInAttesa {
  ordine_id: number;
  numero_conferma: string;
  cliente: string;
  tipo_consegna_ft: string | null;
  data_consegna_ft: string | null;
  giorni_mancanti: number | null;
  ft_preparato: boolean;
  preparato_da: string | null;
  data_preparazione_ft: string | null;
}

export interface DashboardAlert {
  materiali_da_ordinare: AlertMaterialiOrdine[];
  problemi_aperti: AlertProblema[];
  materiali_in_arrivo: AlertMaterialeArrivo[];
  ft_in_attesa: AlertFtInAttesa[];
  ha_alert: boolean;
  timestamp: string;
}

// ── WebSocket event payloads ──

export interface SocketProblemaSegnalato {
  problema_id: number;
  ordine_id: number;
  numero_conferma: string;
  cliente: string;
  fase: string | null;
  gravita: GravitaProblema;
  tipo_problema: string;
  descrizione: string;
  segnalato_da: number;
  segnalato_da_nome: string;
}

export interface SocketMaterialeArrivato {
  ordine_id: number;
  numero_conferma: string;
  cliente: string;
  materiale_id: number;
  tipo_materiale: string;
  sottotipo: string | null;
  note: string | null;
  registrato_da: string;
  timestamp: string;
}

export interface SocketFaseCompletata {
  ordine_id: number;
  numero_conferma: string;
  cliente: string;
  fase_id: number;
  nome_fase: string;
  completata_da: string;
  data_completamento: string;
}

export interface SocketProblemaRisolto {
  problema_id: number;
  ordine_id: number;
  numero_conferma: string;
  cliente: string;
  risolto_da: number;
  risolto_da_nome: string;
  descrizione_risoluzione: string;
  data_risoluzione: string;
  foto_risoluzione_paths: string[] | null;
}

export interface SocketFtPreparato {
  ordine_id: number;
  numero_conferma: string;
  cliente: string;
  preparato_da: string;
  data_preparazione: string;
}

export interface SocketFtConsegnato {
  ordine_id: number;
  numero_conferma: string;
  cliente: string;
  consegnato_da: string;
  data_consegna: string;
}

// Admin user management types
export interface AdminUser {
  id: number;
  nome: string;
  cognome: string;
  email: string;
  ruolo: UserRole;
  reparti: string[];
  attivo: boolean;
  created_at: string;
}

export interface CreateUserRequest {
  nome: string;
  cognome: string;
  email: string;
  pin: string;
  ruolo: UserRole;
  reparti: string[];
}

export interface UpdateUserRequest {
  nome?: string;
  cognome?: string;
  email?: string;
  pin?: string;
  ruolo?: UserRole;
  reparti?: string[];
  attivo?: boolean;
}

export type SocketEventType = 'problema_segnalato' | 'materiale_arrivato' | 'fase_completata' | 'problema_risolto' | 'ft_preparato' | 'ft_consegnato';

export interface AppNotification {
  id: string;
  type: SocketEventType;
  title: string;
  message: string;
  ordine_id: number;
  numero_conferma: string;
  gravita?: GravitaProblema;
  timestamp: string;
  read: boolean;
}
