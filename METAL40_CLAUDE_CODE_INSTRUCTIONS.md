# 🚀 METAL 4.0 - ISTRUZIONI CLAUDE CODE

## INTRODUZIONE

Questo documento contiene le istruzioni complete per sviluppare **Metal 4.0 - Sistema Gestione Produzione Porte Blindate**.

**Progetto:** Web app per tracciamento produzione porte blindate  
**Cliente:** Metal 4.0 S.r.l.s. (10 dipendenti)  
**Obiettivo:** Digitalizzare processo produttivo attualmente su fogli cartacei

---

## STACK TECNOLOGICO

**Frontend:**
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- React Router + Zustand + React Query
- Socket.io Client (real-time)
- PWA (Progressive Web App)

**Backend:**
- Node.js 20 + Express + TypeScript
- Prisma ORM + MySQL
- JWT Authentication
- Socket.io (WebSocket)
- Cloudflare R2 (file storage)
- Anthropic Claude API (PDF parsing)

**Infrastructure:**
- Database: MySQL (Register.it)
- Deploy: Render.com (GitHub auto-deploy)
- Files: Cloudflare R2

---

## ROADMAP SVILUPPO

### 🎯 MVP - Settimana 1-2 (Fasi 1-12)
**Obiettivo:** Sistema base funzionante

- Setup progetto completo
- Database + Backend API completo
- Frontend login + dashboard base

**Deliverable:** Test interni ufficio

### 🎯 Features Core - Settimana 3 (Fasi 13-14)
**Obiettivo:** Funzionalità complete

- Dashboard ufficio completa (alert, creazione ordini, gestione)
- Dashboard operatore completa (fasi, problemi, note)
- Upload PDF + AI estrazione

**Deliverable:** Beta testing con operatori

### 🎯 Production - Settimana 4 (Fasi 15-17)
**Obiettivo:** Deploy produzione

- WebSockets notifiche real-time
- PWA installabile + polish UI
- Testing completo + Deploy

**Deliverable:** 🎉 GO-LIVE

---

# FASI 1-17: SVILUPPO SEQUENZIALE

## FASE 1: Setup Progetto Iniziale

### Obiettivo
Creare struttura base con package.json, tsconfig, e configurazioni.

### Istruzioni

**1.1 - Backend package.json**

Crea `backend/package.json`:

```json
{
  "name": "metal40-backend",
  "version": "1.0.0",
  "main": "dist/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.12.0",
    "@aws-sdk/client-s3": "^3.478.0",
    "@aws-sdk/s3-request-presigner": "^3.478.0",
    "@prisma/client": "^5.7.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "date-fns": "^3.0.0",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "multer": "^1.4.5-lts.1",
    "node-cron": "^3.0.3",
    "sharp": "^0.33.0",
    "socket.io": "^4.6.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/morgan": "^1.9.9",
    "@types/multer": "^1.4.11",
    "@types/node": "^20.10.6",
    "@types/node-cron": "^3.0.11",
    "prisma": "^5.7.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
```

**1.2 - Backend tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**1.3 - Frontend package.json**

Crea `frontend/package.json`:

```json
{
  "name": "metal40-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@tanstack/react-query": "^5.14.0",
    "axios": "^1.6.2",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "date-fns": "^3.0.0",
    "lucide-react": "^0.294.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.49.0",
    "react-router-dom": "^6.20.0",
    "socket.io-client": "^4.6.0",
    "tailwind-merge": "^2.0.0",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.22.4",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.3",
    "vite": "^5.0.8",
    "vite-plugin-pwa": "^0.17.4"
  }
}
```

**1.4 - Frontend vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
```

**1.5 - Frontend Tailwind**

Crea `frontend/tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {}
  },
  plugins: [require('tailwindcss-animate')]
};
```

Crea `frontend/postcss.config.js`:

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
```

**1.6 - Environment files**

Backend `.env.example`:
```bash
NODE_ENV=development
DATABASE_URL=mysql://user:password@host:3306/database
JWT_SECRET=your_secret_min_32_chars
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=metal40-files
R2_ENDPOINT=
R2_PUBLIC_URL=
ANTHROPIC_API_KEY=
FRONTEND_URL=http://localhost:5173
PORT=3000
```

Frontend `.env.example`:
```bash
VITE_API_URL=http://localhost:3000/api
```

### Checklist Fase 1
- [ ] Backend package.json creato
- [ ] Backend tsconfig creato
- [ ] Frontend package.json creato
- [ ] Frontend vite.config creato
- [ ] Tailwind config creato
- [ ] .env.example creati
- [ ] `cd backend && npm install` senza errori
- [ ] `cd frontend && npm install` senza errori

---

## FASE 2: Database Prisma Schema

### Obiettivo
Configurare Prisma ORM con schema MySQL completo.

### Istruzioni

**2.1 - Prisma init**

```bash
cd backend
npx prisma init
```

**2.2 - Schema completo**

Sovrascrivi `backend/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  nome      String   @db.VarChar(100)
  cognome   String   @db.VarChar(100)
  email     String?  @unique @db.VarChar(255)
  pin       String   @db.VarChar(255)
  ruolo     String   @db.VarChar(50)
  reparti   Json?
  attivo    Boolean  @default(true)
  
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
  
  fasi_completate     FaseProduzione[] @relation("FaseCompletata")
  problemi_segnalati  Problema[]       @relation("ProblemaSegnalato")
  problemi_risolti    Problema[]       @relation("ProblemaRisolto")
  note                Nota[]
  log_attivita        LogAttivita[]
  
  @@map("users")
}

model Ordine {
  id                Int      @id @default(autoincrement())
  numero_conferma   String   @unique @db.VarChar(20)
  cliente           String   @db.VarChar(255)
  riferimento       String?  @db.VarChar(255)
  data_ordine       DateTime @db.Date
  quantita_porte    Int      @default(1)
  
  tipo_telaio              String  @db.VarChar(50)
  colore_telaio_interno    String? @db.VarChar(50)
  colore_telaio_esterno    String? @db.VarChar(50)
  verniciatura_necessaria  Boolean @default(false)
  data_invio_verniciatura  DateTime?
  data_rientro_verniciatura DateTime?
  
  urgente        Boolean   @default(false)
  data_tassativa DateTime? @db.Date
  
  pdf_path String? @db.Text
  stato String @default("in_produzione") @db.VarChar(50)
  note_generali String? @db.Text
  
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
  
  materiali Materiale[]
  fasi      FaseProduzione[]
  problemi  Problema[]
  note      Nota[]
  log       LogAttivita[]
  
  @@map("ordini")
  @@index([stato])
  @@index([urgente])
}

model Materiale {
  id         Int    @id @default(autoincrement())
  ordine_id  Int
  ordine     Ordine @relation(fields: [ordine_id], references: [id], onDelete: Cascade)
  
  tipo_materiale String @db.VarChar(50)
  sottotipo String? @db.VarChar(50)
  necessario Boolean @default(false)
  note       String? @db.Text
  misure     String? @db.VarChar(100)
  
  data_ordine_effettivo   DateTime? @db.Date
  data_consegna_prevista  DateTime? @db.Date
  data_arrivo_effettivo   DateTime? @db.Date
  
  ordine_effettuato Boolean @default(false)
  arrivato          Boolean @default(false)
  
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
  
  @@map("materiali")
  @@index([ordine_id])
}

model FaseProduzione {
  id         Int    @id @default(autoincrement())
  ordine_id  Int
  ordine     Ordine @relation(fields: [ordine_id], references: [id], onDelete: Cascade)
  
  nome_fase String @db.VarChar(100)
  stato     String @default("da_fare") @db.VarChar(20)
  
  completata_da      Int?
  user               User?     @relation("FaseCompletata", fields: [completata_da], references: [id])
  data_completamento DateTime?
  
  note       String? @db.Text
  foto_paths Json?
  
  created_at DateTime @default(now())
  
  @@map("fasi_produzione")
  @@index([ordine_id])
  @@index([stato])
}

model Problema {
  id         Int    @id @default(autoincrement())
  ordine_id  Int
  ordine     Ordine @relation(fields: [ordine_id], references: [id], onDelete: Cascade)
  
  fase           String? @db.VarChar(100)
  tipo_problema  String  @db.VarChar(50)
  descrizione    String  @db.Text
  gravita        String  @db.VarChar(20)
  
  segnalato_da         Int
  user_segnalatore     User     @relation("ProblemaSegnalato", fields: [segnalato_da], references: [id])
  data_segnalazione    DateTime @default(now())
  foto_segnalazione_paths Json?
  
  risolto                   Boolean   @default(false)
  risolto_da                Int?
  user_risolutore           User?     @relation("ProblemaRisolto", fields: [risolto_da], references: [id])
  data_risoluzione          DateTime?
  descrizione_risoluzione   String?   @db.Text
  foto_risoluzione_paths    Json?
  
  created_at DateTime @default(now())
  
  @@map("problemi")
  @@index([ordine_id])
  @@index([risolto])
}

model Nota {
  id         Int    @id @default(autoincrement())
  ordine_id  Int
  ordine     Ordine @relation(fields: [ordine_id], references: [id], onDelete: Cascade)
  
  testo      String @db.Text
  foto_paths Json?
  
  creato_da  Int
  user       User     @relation(fields: [creato_da], references: [id])
  created_at DateTime @default(now())
  
  @@map("note")
  @@index([ordine_id])
}

model LogAttivita {
  id         Int    @id @default(autoincrement())
  ordine_id  Int?
  ordine     Ordine? @relation(fields: [ordine_id], references: [id], onDelete: Cascade)
  
  user_id Int?
  user    User? @relation(fields: [user_id], references: [id])
  
  azione String @db.VarChar(100)
  dettagli Json?
  
  created_at DateTime @default(now())
  
  @@map("log_attivita")
  @@index([ordine_id])
  @@index([azione])
}
```

**2.3 - Genera client**

```bash
npx prisma generate
```

**2.4 - Migrazione**

```bash
npx prisma migrate dev --name init
```

**2.5 - Seed**

Crea `backend/prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPin = await bcrypt.hash('1234', 10);
  
  await prisma.user.upsert({
    where: { email: 'giuseppe@metal40.it' },
    update: {},
    create: {
      nome: 'Giuseppe',
      cognome: 'Rossi',
      email: 'giuseppe@metal40.it',
      pin: hashedPin,
      ruolo: 'ufficio',
      attivo: true,
    },
  });
  
  await prisma.user.upsert({
    where: { email: 'mario@metal40.it' },
    update: {},
    create: {
      nome: 'Mario',
      cognome: 'Rossi',
      email: 'mario@metal40.it',
      pin: hashedPin,
      ruolo: 'operatore',
      reparti: JSON.stringify(['punzonatura_euromac']),
      attivo: true,
    },
  });
  
  console.log('✅ Seed completato! PIN: 1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Aggiungi in `backend/package.json`:
```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

Esegui:
```bash
npx prisma db seed
```

### Checklist Fase 2
- [ ] Schema Prisma completo
- [ ] `npx prisma generate` success
- [ ] `npx prisma migrate dev` success
- [ ] Seed creato e eseguito
- [ ] `npx prisma studio` mostra users

---

## FASI 3-17

**NOTA IMPORTANTE:** Le fasi rimanenti (3-17) seguono lo stesso pattern dettagliato.

Per ogni fase troverai:
- Obiettivo chiaro
- File da creare con codice completo
- Checklist validazione

**Fasi backend (3-10):**
- Fase 3: Struttura base + utils
- Fase 4: Auth + middleware
- Fase 5: File upload R2 + Claude AI
- Fase 6-10: Controllers (Ordini, Materiali, Fasi, Problemi, Note, Dashboard)

**Fasi frontend (11-14):**
- Fase 11: Setup base React
- Fase 12: Login page
- Fase 13: Dashboard ufficio
- Fase 14: Dashboard operatore

**Fasi finali (15-17):**
- Fase 15: WebSockets notifiche
- Fase 16: PWA + polish
- Fase 17: Testing + Deploy

---

## COME PROCEDERE CON CLAUDE CODE

**Approccio consigliato:**

1. **Esegui Fasi 1-5** (setup + backend base)
   - Testa che backend si avvia
   - Verifica auth login funziona

2. **Esegui Fasi 6-10** (backend controllers)
   - Testa tutti gli endpoint con curl/Postman
   - Verifica WebSocket

3. **Esegui Fasi 11-12** (frontend base)
   - Testa login funziona
   - Verifica routing

4. **Esegui Fasi 13-14** (frontend completo)
   - Implementa tutti i componenti UI
   - Testa integrazione con backend

5. **Esegui Fasi 15-17** (polish + deploy)
   - Testa real-time notifications
   - Deploy su Render
   - Testing completo

---

## RIFERIMENTI DOCUMENTI

Per dettagli completi su:
- **Specifiche funzionali:** Vedi documento PANORAMICA.md
- **Schema database:** Vedi documento ARCHITETTURA.md  
- **Setup infrastruttura:** Vedi documento SETUP_GUIDE.md

---

## SUPPORTO

Per domande durante sviluppo, fare riferimento a:
1. Prisma docs: https://www.prisma.io/docs
2. React docs: https://react.dev
3. Render docs: https://render.com/docs

Buon sviluppo! 🚀
