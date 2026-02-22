# CLAUDE.md

Questo file fornisce indicazioni a Claude Code (claude.ai/code) per lavorare con il codice in questo repository.

## Panoramica Progetto

**Metal 4.0** - Sistema di tracciamento produzione per Metal 4.0 S.r.l.s., produttore di porte blindate su misura (10 dipendenti). Digitalizza il processo produttivo attualmente gestito su fogli cartacei in una web app full-stack con aggiornamenti real-time e supporto PWA.

**Stato attuale:** Tutte le 17 fasi della roadmap completate. App in produzione su Render.com. Funzionalità extra (importazione ordini da PDF con AI) implementata.

## File di Documentazione

| File | Contenuto |
|------|-----------|
| `METAL40_PANORAMICA.md` | Requisiti funzionali, user stories, regole di workflow |
| `METAL40_ARCHITETTURA.md` | Stack tecnologico, schema DB, endpoint API, auth, eventi WebSocket |
| `METAL40_CLAUDE_CODE_INSTRUCTIONS.md` | Roadmap di sviluppo a 17 fasi con template di codice |
| `METAL40_SETUP_GUIDE.md` | Setup infrastruttura (Register.it, Cloudflare R2, Render.com) |
| `METAL40_DOCUMENTO_TECNICO_COMPLETO.md` | Specifica tecnica completa (tutto-in-uno) |

## Stack Tecnologico

**Frontend:** React 18 + TypeScript, Vite, Tailwind CSS + shadcn/ui, React Router, Zustand, TanStack Query, Socket.io Client, React Hook Form + Zod, PWA tramite vite-plugin-pwa

**Backend:** Node.js 20 + Express + TypeScript, Prisma ORM, auth JWT (PIN hashato con bcrypt), Socket.io, Multer + Sharp (upload file), AWS SDK S3 (Cloudflare R2), Anthropic Claude API (parsing PDF), node-cron

**Database:** MySQL 8.0+ (hostato su Register.it)

**Deploy:** Render.com (frontend static site gratuito, backend web service $7/mese), Cloudflare R2 (storage file)

## Comandi di Sviluppo

```bash
# Backend
cd backend && npm install
npm run dev                    # tsx watch src/server.ts (hot reload, porta 3000)
npm run build                  # tsc
npm start                      # node dist/server.js

# Prisma
npx prisma generate            # Genera client dopo modifiche allo schema
npx prisma migrate dev          # Crea/applica migrazioni in sviluppo
npx prisma migrate deploy       # Applica migrazioni in produzione
npx prisma studio               # Esplora database con GUI (porta 5555)
npx prisma db seed              # Popola dati di test (PIN: 1234)

# Frontend
cd frontend && npm install
npm run dev                     # Server di sviluppo Vite (porta 5173, proxy /api verso :3000)
npm run build                   # tsc && vite build
npm run preview                 # Anteprima build di produzione
```

## Architettura

Architettura a tre livelli con layer WebSocket real-time:

```
Frontend (React SPA)                    Backend (Express REST API)           MySQL
┌──────────────────────┐   REST+WS     ┌─────────────────────────┐  SQL    ┌──────┐
│ Dashboard Ufficio    │◄──────────────►│ /api/* endpoints        │◄──────►│Prisma│
│ (Desktop)            │               │ Socket.io server         │        │ ORM  │
│                      │               │ JWT + PIN auth           │        └──────┘
│ Dashboard Operatori  │               │ File upload → R2         │
│ (Tablet)             │               │ Claude API (parsing PDF) │        Cloudflare R2
│ PWA installabile     │               │ Cron jobs                │───────►(storage file)
└──────────────────────┘               └─────────────────────────┘
```

**Due ruoli utente:**
- `ufficio`: Crea/gestisce ordini, gestisce materiali, risolve problemi, dashboard completa
- `operatore`: Completa fasi produzione, segnala problemi, aggiunge note, conferma arrivi materiali

**7 reparti produzione:** Punzonatura Dalcos, Punzonatura Euromac, Piegatura, Saldatura/Assemblaggio, Rivestimento, Imballaggio, Magazzino/Ricezione

## Schema Database (7 tabelle)

- **users** - Personale con ruolo (`ufficio`/`operatore`), PIN hashato bcrypt, reparti assegnati (JSON)
- **ordini** - Commesse con numero conferma (univoco), cliente, tipo telaio, colori, urgenza, stato (`in_produzione`/`bloccato`/`pronto_spedizione`/`spedito`)
- **materiali** - 9 tipologie per ordine con tracciamento ordini/consegne e flag booleani
- **fasi_produzione** - Fasi produttive per ordine, stato (`da_fare`/`completata`), operatore che ha completato
- **problemi** - Segnalazioni con 3 livelli di gravita (`bassa`/`media`/`alta_bloccante`), tracciamento segnalatore/risolutore, foto prima/dopo
- **note** - Comunicazioni interne con foto
- **log_attivita** - Registro di tutte le azioni (audit trail)

Tutte le tabelle figlie hanno cascade delete alla rimozione dell'ordine. Schema definito in `backend/prisma/schema.prisma`.

## Struttura API

URL base: `/api`. Autenticazione tramite JWT Bearer token (scadenza 8 ore). Rate limit: 100 req/min generale, 5 tentativi login/15min.

Gruppi endpoint: `/auth/*`, `/ordini/*`, `/materiali/*`, `/fasi/*`, `/problemi/*`, `/dashboard/*`, `/upload/*`

Accesso per ruolo: creazione/modifica/eliminazione ordini solo `ufficio`; completamento fasi solo `operatore`; segnalazione problemi e note disponibili a tutti gli utenti autenticati.

## Regole di Business

- Produzione telaio e scocca procedono in parallelo
- La produzione scocca inizia quando il pannello e arrivato OPPURE mancano massimo 7 giorni alla consegna
- Verniciatura necessaria per colori fuori standard (marrone/bianco = standard, nessuna verniciatura)
- Tempi consegna materiali: pannelli Okoume/MDF +30gg, pannelli PVC/Alluminio +40gg, mostrine/vetri/maniglioni +20gg
- I materiali "laminato" sono a magazzino e non vengono tracciati
- I problemi bloccanti (`alta_bloccante`) generano alert WebSocket immediato con suono per gli utenti ufficio

## Approccio di Sviluppo

Seguire la roadmap sequenziale a 17 fasi. Ogni fase ha obiettivo, file da creare e checklist di validazione. Raggruppamento consigliato:
1. Fasi 1-5: Setup progetto + backend base (struttura, auth, upload file)
2. Fasi 6-10: Controller backend (ordini, materiali, fasi, problemi, dashboard)
3. Fasi 11-12: Frontend base (setup React, login)
4. Fasi 13-14: Dashboard frontend (ufficio + operatore)
5. Fasi 15-17: Notifiche real-time, PWA, testing, deploy

## Variabili d'Ambiente

Backend richiede: `DATABASE_URL`, `JWT_SECRET`, `ANTHROPIC_API_KEY`, `FRONTEND_URL`, `PORT`

Backend opzionali (Cloudflare R2, se non presenti l'upload file viene saltato): `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_ENDPOINT`, `R2_PUBLIC_URL`

Frontend richiede: `VITE_API_URL`

Template in `backend/.env.example` e `frontend/.env.example`.

## Convenzioni Frontend

- Alias percorsi: `@/` mappa a `frontend/src/`
- Libreria componenti: shadcn/ui (primitive Radix + Tailwind)
- Stato: Zustand per stato globale, TanStack Query per stato server
- Form: React Hook Form + schemi di validazione Zod
- Icone: lucide-react
- Gestione date: date-fns
- Client API: axios

## Eventi WebSocket (Socket.io)

Il server emette nella room `ufficio`: `problema_segnalato`, `materiale_arrivato`, `fase_completata`, `problema_risolto`

## Importazione Ordini da PDF (Claude AI)

Funzionalità che permette all'ufficio di caricare un PDF della conferma d'ordine e creare automaticamente un ordine con i dati estratti dall'AI.

**Flusso:**
1. Pagina Ordini → bottone "Importa da PDF" (solo ruolo `ufficio`)
2. Dialog modale con zona drag & drop per upload PDF (max 10MB)
3. Backend: Multer riceve il file → upload su R2 (opzionale) → Claude AI estrae i dati
4. Dialog mostra i dati estratti in tabella per revisione
5. Bottone "Crea Ordine con questi dati" → naviga a `/ordini/nuovo` con dati pre-compilati via `location.state`
6. Form ordine pre-compilato con banner "Dati importati da PDF"

**File coinvolti:**
- `backend/src/utils/claude.ts` - Prompt di estrazione + parsing risposta (strip markdown code blocks)
- `backend/src/utils/r2.ts` - Upload R2 (opzionale, fallback se non configurato)
- `backend/src/routes/upload.ts` - Endpoint `POST /api/upload/pdf`
- `frontend/src/services/upload.ts` - Tipi `ExtractedOrderData`, `PdfUploadResponse`
- `frontend/src/components/ordini/PdfUploadDialog.tsx` - Dialog upload + revisione dati AI
- `frontend/src/pages/OrdiniPage.tsx` - Bottone "Importa da PDF"
- `frontend/src/pages/OrdineFormPage.tsx` - Lettura `location.state` per dati pre-compilati + `pdf_path`
- `frontend/src/components/ordini/OrdineForm.tsx` - Banner importazione PDF, prop `pdfPath`

**Mapping dati AI → form:**
- `numero_conferma`, `cliente`, `colore_telaio_esterno`, `colore_telaio_interno` → campi diretti
- `tipo_telaio` → mappato ai valori enum DB (`standard_falsotelaio`, `ristrutturazione_l`, `ristrutturazione_z`, `falsotelaio_non_nostro`)
- `pannello_*`, `mostrine`, `kit_imbotte`, `vetro`, `maniglione`, `note` → aggregati in `note_generali`
- Auto-detection verniciatura: se colore esterno/interno NON contiene "marrone" o "bianco" → `verniciatura_necessaria = true`
