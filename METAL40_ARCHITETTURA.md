# 🏗️ METAL 4.0 - ARCHITETTURA TECNICA

## STACK COMPLETO

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui
- React Router (routing)
- Zustand (state management leggero)
- React Query (API calls + cache)
- Socket.io Client (WebSocket)
- React Hook Form + Zod (validazione)
- Vite PWA Plugin

### Backend
- Node.js 20 LTS
- Express.js (API REST)
- TypeScript
- Prisma ORM
- JWT (autenticazione)
- Socket.io (WebSocket server)
- Multer (file upload)
- AWS SDK S3 (per R2)
- Sharp (image compression)
- Anthropic Claude API
- Node-cron (scheduled jobs)
- Bcrypt (password hashing)

### Database
- MySQL 8.0+ (Register.it)
- Prisma migrations
- JSON columns per arrays

### Infrastructure
- **Frontend Deploy:** Render.com Static Site (Free)
- **Backend Deploy:** Render.com Web Service (Starter $7/mese)
- **Database:** MySQL Register.it (incluso hosting)
- **File Storage:** Cloudflare R2 (Free 10GB)
- **AI:** Anthropic Claude API (~10€/mese)
- **VCS:** GitHub
- **Auto-deploy:** GitHub → Render

**COSTO MENSILE:** ~17€

---

## DATABASE SCHEMA

### Tabelle

**1. users** - Utenti/Operatori
- id, nome, cognome, email, pin (hashed)
- ruolo ('ufficio' | 'operatore')
- reparti (JSON array per operatori)
- attivo (boolean)

**2. ordini** - Commesse/Porte
- numero_conferma (unique)
- cliente, riferimento
- data_ordine, quantita_porte
- tipo_telaio, colori, verniciatura_necessaria
- urgente, data_tassativa
- pdf_path
- stato ('in_produzione' | 'bloccato' | 'pronto_spedizione' | 'spedito')
- note_generali

**3. materiali** - Materiali da ordinare
- ordine_id (FK)
- tipo_materiale, sottotipo
- necessario (boolean)
- note, misure
- data_ordine_effettivo, data_consegna_prevista, data_arrivo_effettivo
- ordine_effettuato, arrivato (booleans)

**4. fasi_produzione** - Timeline completamento
- ordine_id (FK)
- nome_fase (enum fasi)
- stato ('da_fare' | 'completata')
- completata_da (FK user), data_completamento
- note, foto_paths (JSON)

**5. problemi** - Segnalazioni
- ordine_id (FK)
- fase, tipo_problema, descrizione, gravita
- segnalato_da (FK user), data_segnalazione, foto_segnalazione_paths (JSON)
- risolto (boolean)
- risolto_da (FK user), data_risoluzione, descrizione_risoluzione, foto_risoluzione_paths (JSON)

**6. note** - Comunicazioni
- ordine_id (FK)
- testo, foto_paths (JSON)
- creato_da (FK user), created_at

**7. log_attivita** - Audit trail
- ordine_id (FK), user_id (FK)
- azione (string), dettagli (JSON)
- created_at

### Relazioni
- Ordine 1:N Materiali, Fasi, Problemi, Note
- User 1:N Fasi completate, Problemi segnalati/risolti
- Cascade delete su ordine eliminato

### Indici
- ordini: stato, urgente, numero_conferma
- materiali: ordine_id, (ordine_effettuato, arrivato)
- fasi_produzione: ordine_id, stato, nome_fase
- problemi: ordine_id, risolto, gravita
- note: ordine_id, created_at
- log_attivita: ordine_id, user_id, azione, created_at

---

## API ENDPOINTS

Base URL: `/api`

### Auth
- `POST /auth/login` - Login con PIN
- `GET /auth/me` - User corrente (JWT required)
- `POST /auth/logout` - Logout

### Ordini
- `GET /ordini?stato=&urgente=&search=&page=&limit=` - Lista con filtri
- `GET /ordini/:id` - Dettaglio completo
- `POST /ordini` - Crea nuovo (ufficio only)
- `PUT /ordini/:id` - Modifica (ufficio only)
- `DELETE /ordini/:id` - Elimina (ufficio only)

### Materiali
- `GET /ordini/:ordineId/materiali` - Lista materiali ordine
- `PUT /materiali/:id` - Modifica (ufficio only)
- `POST /materiali/:id/ordina` - Segna ordinato (ufficio only)
- `POST /materiali/:id/arrivato` - Segna arrivato (tutti)
- `GET /materiali/da-ordinare` - Alert (ufficio only)

### Fasi
- `GET /ordini/:ordineId/fasi` - Lista fasi ordine
- `POST /fasi/:id/completa` - Completa fase (operatore)
- `GET /fasi/mie?completate=false` - Fasi operatore loggato

### Problemi
- `GET /problemi?risolto=&gravita=&ordine_id=` - Lista con filtri
- `GET /problemi/:id` - Dettaglio
- `POST /ordini/:ordineId/problemi` - Segnala (tutti)
- `PUT /problemi/:id/risolvi` - Risolvi (ufficio + segnalatore)

### Note
- `GET /ordini/:ordineId/note` - Lista note
- `POST /ordini/:ordineId/note` - Aggiungi (tutti)

### Dashboard
- `GET /dashboard/stats` - KPI (ufficio only)
- `GET /dashboard/alert` - Alert giornaliero (ufficio only)

### Upload
- `POST /upload/pdf` - Upload PDF + AI estrazione (ufficio only)
- `POST /upload/foto` - Upload foto (tutti)

**Auth:** JWT Bearer token in header  
**Rate Limit:** 100 req/min generale, 5 login/15min

---

## AUTENTICAZIONE

**JWT Token:**
```json
{
  "userId": 1,
  "email": "giuseppe@metal40.it",
  "ruolo": "ufficio",
  "iat": 1707912000,
  "exp": 1707940800
}
```

- Expiration: 8 ore
- Secret: 32+ caratteri random (env)
- Header: `Authorization: Bearer {token}`

**PIN Storage:**
- Hashed bcrypt (10 rounds)
- 4 cifre numeriche
- Mai restituito in responses

**Middleware:**
- `authenticate` - Verifica JWT
- `requireRole('ufficio')` - Autorizzazione
- Rate limiting
- CORS whitelist

---

## FILE STORAGE (Cloudflare R2)

**Bucket:** `metal40-files`

**Struttura:**
```
metal40-files/
├── pdfs/
│   └── {numero_conferma}-{timestamp}.pdf
└── foto/
    └── {ordine_id}-{tipo}-{timestamp}.jpg
```

**Upload:**
- PDF: max 10MB
- Foto: compressa 1920px width, quality 85%, max 5MB output
- S3-compatible API (AWS SDK)

**Access:**
- Public URL: `https://pub-xxxxx.r2.dev/{key}`
- Oppure signed URL (1h expiry)

**SDK:**
```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
```

---

## CLAUDE AI INTEGRATION

**API:** Anthropic Claude API (Sonnet 4)

**Uso:** Estrazione dati da PDF foglio produzione

**Endpoint:** `/upload/pdf`

**Workflow:**
1. Frontend upload PDF (max 10MB)
2. Backend converte a base64
3. Chiamata Claude API con documento + prompt
4. Parsing JSON response
5. Return dati estratti + PDF path

**Prompt Template:**
```
Estrai questi dati dal foglio produzione porta blindata:
- Numero conferma ordine
- Cliente
- Tipo telaio (4 opzioni)
- Colori telaio
- Pannelli (tipo + modello)
- Mostrine, Kit imbotte, Vetri, Maniglione
Rispondi SOLO JSON valido.
```

**Response:**
```json
{
  "numero_conferma": "7743",
  "cliente": "ARREDO NORBA",
  "tipo_telaio": "standard_falsotelaio",
  ...
}
```

---

## WEBSOCKETS (Real-time)

**Server:** Socket.io

**Rooms:**
- `ufficio` - Tutti utenti ufficio

**Eventi Server → Client:**
- `problema_segnalato` - Notifica problema (soprattutto bloccanti)
- `materiale_arrivato` - Notifica arrivo materiale
- `fase_completata` - Notifica fase completata
- `problema_risolto` - Notifica risoluzione

**Setup Client:**
```typescript
import { io } from 'socket.io-client';

const socket = io(BACKEND_URL);
socket.emit('join_ufficio');

socket.on('problema_segnalato', (data) => {
  if (data.gravita === 'alta_bloccante') {
    showUrgentAlert(data);
  }
});
```

---

## CRON JOBS

**Job giornaliero 08:00:**
- Count materiali da ordinare
- (Futuro: Email riepilogo)
- Backup database

**Job orario:**
- Check problemi bloccanti aperti >24h
- (Futuro: Alert escalation)

**Setup:**
```typescript
import cron from 'node-cron';

cron.schedule('0 8 * * *', async () => {
  // Daily tasks
});
```

---

## PWA (Progressive Web App)

**Manifest:**
```json
{
  "name": "Metal 4.0 Produzione",
  "short_name": "Metal 4.0",
  "description": "Sistema gestione produzione",
  "theme_color": "#ffffff",
  "icons": [
    { "src": "logo-192.png", "sizes": "192x192" },
    { "src": "logo-512.png", "sizes": "512x512" }
  ]
}
```

**Service Worker:**
- Cache-first per assets statici
- Network-first per API calls
- Offline fallback page

**Install Prompt:**
- Browser mostra "Aggiungi a schermata Home"
- Installabile su Android/iOS
- Icona app su home screen

---

## SECURITY

**Headers (Helmet):**
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options

**CORS:**
- Whitelist frontend URL
- Credentials: true

**Rate Limiting:**
- General: 100 req/min
- Login: 5 req/15min

**Input Validation:**
- Zod schemas per tutti input
- Sanitization automatica

**File Upload:**
- MIME type check
- File size limits
- Virus scan (futuro)

---

## MONITORING

**Logs:**
- Morgan (HTTP requests)
- Custom logger (info, error, debug)
- Structured JSON logs

**Metrics (Render):**
- CPU/RAM usage
- Response times
- Error rates

**Alerts:**
- Email su crash (Render)
- Webhook su errori critici (futuro)

---

## SCALABILITY

**Current Capacity:**
- 500+ ordini/anno
- 10-15 utenti concurrent
- 1000+ ordini storici
- ~10GB file storage

**Bottlenecks:**
- Database: MySQL connection pool (10 connections)
- R2: Rate limits (1M ops/month free)
- Render: 512MB RAM backend

**Scaling Path:**
- Upgrade Render instance ($25/mese → 2GB RAM)
- Database read replicas
- CDN per file statici
- Redis cache (futuro)

---

Per guide setup, vedi: SETUP_GUIDE.md  
Per sviluppo, vedi: CLAUDE_CODE_INSTRUCTIONS.md
