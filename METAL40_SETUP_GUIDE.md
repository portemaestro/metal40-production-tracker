# 🔧 METAL 4.0 - GUIDA SETUP INFRASTRUTTURA

## PANORAMICA

Questa guida ti porta passo-passo attraverso il setup di tutta l'infrastruttura necessaria per Metal 4.0.

**Componenti da configurare:**
1. ✅ Register.it - Database MySQL
2. ✅ Cloudflare R2 - File Storage
3. ✅ GitHub - Repository codice
4. ✅ Render.com - Deploy backend + frontend
5. ✅ Ambiente locale - Sviluppo

**Tempo stimato:** 1-2 ore

---

## PREREQUISITI

**Software necessario:**
- Node.js 20+ LTS → https://nodejs.org/
- Git → https://git-scm.com/downloads
- VS Code (consigliato) → https://code.visualstudio.com/

**Account necessari:**
- Register.it (già hai hosting)
- GitHub
- Render.com
- Cloudflare
- Anthropic Claude API

**Verifica installazioni:**
```bash
node --version  # v20.x.x
npm --version   # 10.x.x
git --version   # 2.x.x
```

---

## 1. SETUP REGISTER.IT - DATABASE MYSQL

### Step 1: Accesso Pannello

1. Vai su: `https://wlcp.register.it/`
2. Login con credenziali Register.it
3. Menu laterale → **Web Hosting**
4. Seleziona dominio: `guidaporteblindate.it` (o altro tuo dominio)

### Step 2: Creazione Database MySQL

1. Pannello principale → Sezione **Database**
2. Click **[+ Aggiungi Database]** o **Gestisci Database**
3. Compila form:
   ```
   Nome database: metal40_production
   Utente: metal40_user (o auto-generato)
   Password: [Genera password sicura]
   ```
4. ⚠️ **IMPORTANTE:** Copia SUBITO e salva:
   - Nome database
   - Utente
   - Password
   - Hostname (es: `mysql.register.it`)
   - Porta (solitamente `3306`)

5. Click **Crea Database**

### Step 3: Annotare Credenziali

Crea file locale `.credentials.txt` (NON commitare su Git!):

```bash
# Register.it MySQL
DB_HOST=mysql.register.it
DB_PORT=3306
DB_NAME=metal40_production
DB_USER=metal40_user
DB_PASSWORD=LA_TUA_PASSWORD_QUI

# Connection string completa (per Render)
DATABASE_URL=mysql://metal40_user:LA_TUA_PASSWORD_QUI@mysql.register.it:3306/metal40_production
```

### Step 4: Configurazione Accesso Remoto (se necessario)

**Se Register.it blocca connessioni remote:**

1. Pannello Database → **Gestione Accessi**
2. Aggiungi IP autorizzati:
   - Per sviluppo locale: il tuo IP pubblico (cerca "my ip" su Google)
   - Per Render.com: vedi https://render.com/docs/static-outbound-ip-addresses
3. OPPURE abilita "Tutti gli IP" (meno sicuro ma più semplice)
4. Salva

### Step 5: Test Connessione (Opzionale)

**Con MySQL Workbench:**
1. Download: https://dev.mysql.com/downloads/workbench/
2. Installa e apri
3. Click **[+]** nuova connessione
4. Inserisci credenziali:
   - Hostname: `mysql.register.it`
   - Port: `3306`
   - Username: `metal40_user`
   - Password: [Store in Vault]
5. **Test Connection**
6. Se OK → Connessione funzionante ✅

**Da terminale:**
```bash
mysql -h mysql.register.it -P 3306 -u metal40_user -p
# Inserisci password
# Se vedi mysql> → Success!
```

✅ **Database MySQL configurato!**

---

## 2. SETUP CLOUDFLARE R2 - FILE STORAGE

### Step 1: Registrazione Cloudflare

**Se NON hai account:**
1. Vai su: `https://dash.cloudflare.com/sign-up`
2. Inserisci email + password
3. Verifica email
4. Login

**Se hai già account:**
1. Vai su: `https://dash.cloudflare.com/login`
2. Login

### Step 2: Attivazione R2

1. Dashboard Cloudflare → Menu laterale sinistro
2. Scorri fino a **R2 Object Storage**
3. Click **R2**
4. Se prima volta:
   - Click **Get Started** o **Purchase R2**
   - Piano gratuito: 10GB storage + 1M richieste/mese
   - **NON serve carta di credito per free tier!**
5. Accetta Terms of Service
6. Click **Enable R2**

### Step 3: Creazione Bucket

1. Dashboard R2 → Click **Create Bucket**
2. Compila:
   ```
   Bucket Name: metal40-files
   Location: Automatic (consigliato)
   ```
3. Click **Create Bucket**

✅ **Bucket creato!**

### Step 4: Generazione API Token

1. Dashboard R2 → Tab **Manage R2 API Tokens**
2. Click **Create API Token**
3. Compila:
   ```
   Token Name: metal40-backend-token
   
   Permissions:
   ☑ Object Read & Write
   
   Specify bucket(s): (opzionale ma consigliato)
   - Seleziona: metal40-files
   
   TTL: Forever (o scegli durata)
   ```
4. Click **Create API Token**

### Step 5: COPIA CREDENZIALI SUBITO!

⚠️ **ATTENZIONE:** Secret Access Key NON sarà più visibile!

Vedrai schermata con:
```
Access Key ID: abc123def456xyz789...
Secret Access Key: xyz789uvw012abc345...
Endpoint for S3 Clients: https://[account-id].r2.cloudflarestorage.com
```

**Copia TUTTO in `.credentials.txt`:**

```bash
# Cloudflare R2
R2_ACCOUNT_ID=il_tuo_account_id
R2_ACCESS_KEY_ID=abc123def456xyz789...
R2_SECRET_ACCESS_KEY=xyz789uvw012abc345...
R2_BUCKET_NAME=metal40-files
R2_ENDPOINT=https://[account-id].r2.cloudflarestorage.com
```

**Dove trovare Account ID:**
- Dashboard R2 → laterale destro: "Account ID"
- Oppure nell'URL endpoint: `https://[QUESTO-QUI].r2.cloudflarestorage.com`

### Step 6: Abilita Accesso Pubblico

**Opzione A: R2.dev subdomain** (più facile, consigliato)

1. Bucket `metal40-files` → Tab **Settings**
2. Sezione **Public Access** → Click **Allow Access**
3. Click **Enable Public Access**
4. Vedrai URL: `https://pub-xxxxx.r2.dev`
5. Annota in `.credentials.txt`:
   ```bash
   R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
   ```

**Opzione B: Custom Domain** (più professionale)

1. Settings → **Connect Domain**
2. Inserisci: `files.metal40.it`
3. Cloudflare configura DNS automaticamente
4. Dopo qualche minuto: `https://files.metal40.it/{file}`
5. Annota:
   ```bash
   R2_PUBLIC_URL=https://files.metal40.it
   ```

✅ **Cloudflare R2 configurato!**

---

## 3. SETUP GITHUB REPOSITORY

### Step 1: Crea Repository

1. Vai su: `https://github.com/new`
2. Compila:
   ```
   Repository name: metal40-app
   Description: Sistema gestione produzione Metal 4.0
   Visibility: ● Private (consigliato)
   
   ☐ Add README (faremo dopo)
   ☐ Add .gitignore (faremo dopo)
   ```
3. Click **Create Repository**

### Step 2: Clone Locale

```bash
# Apri terminale
# Naviga dove vuoi il progetto
cd C:\Users\Mauro\Projects  # Windows
# cd ~/Projects  # Mac/Linux

# Clone repository
git clone https://github.com/TUO_USERNAME/metal40-app.git
cd metal40-app
```

### Step 3: Crea .gitignore

Crea file `.gitignore` nella root:

```
# Dependencies
node_modules/
.pnp
.pnp.js

# Environment variables
.env
.env.local
.env.*.local
*.env
.credentials.txt

# Build outputs
dist/
build/
.next/
out/

# Logs
logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp

# Temp
*.tmp
.temp/
```

### Step 4: Primo Commit

```bash
git add .gitignore
git commit -m "Initial commit: setup .gitignore"
git push origin main
```

✅ **GitHub repository pronto!**

---

## 4. SETUP RENDER.COM - DEPLOY

### Step 1: Registrazione Render

1. Vai su: `https://dashboard.render.com/register`
2. **Opzione facile:** Click **Sign up with GitHub**
3. Autorizza Render ad accedere repository
4. Completa registrazione

### Step 2: Connetti Repository

1. Dashboard Render → Settings → **Connected Accounts**
2. GitHub → **Connect**
3. Autorizza
4. Seleziona repository: `metal40-app`

### Step 3: Deploy BACKEND (Web Service)

**3a. Crea servizio**

1. Dashboard → **New +** → **Web Service**
2. Seleziona repository: `metal40-app`
3. Click **Connect**

**3b. Configurazione**

```
Name: metal40-api

Region: Frankfurt (EU) - consigliato per Italia

Branch: main

Root Directory: backend

Runtime: Node

Build Command:
npm install && npx prisma generate

Start Command:
npm start

Instance Type:
● Starter ($7/month)
  - 512 MB RAM
  - Shared CPU
  - SEMPRE ATTIVO (no sleep)

Auto-Deploy: Yes
```

**3c. Environment Variables**

Scroll → **Environment Variables** → **Add Environment Variable**

Aggiungi UNA PER UNA (copia da `.credentials.txt`):

```bash
NODE_ENV=production

# Database
DATABASE_URL=mysql://metal40_user:PASSWORD@mysql.register.it:3306/metal40_production

# JWT (genera stringa random 32+ caratteri)
JWT_SECRET=GENERA_STRINGA_RANDOM_QUI

# Cloudflare R2
R2_ACCOUNT_ID=tuo_account_id
R2_ACCESS_KEY_ID=abc123...
R2_SECRET_ACCESS_KEY=xyz789...
R2_BUCKET_NAME=metal40-files
R2_ENDPOINT=https://xxxxx.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev

# Anthropic
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# CORS
FRONTEND_URL=https://metal40-app.onrender.com

# Port
PORT=3000
```

**Genera JWT_SECRET:**
```bash
# Da terminale
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**3d. Deploy**

1. Click **Create Web Service**
2. Render inizia build automaticamente
3. Vedi logs in tempo reale
4. Dopo 2-3 minuti: **Live** ✅
5. URL backend: `https://metal40-api.onrender.com`

### Step 4: Deploy FRONTEND (Static Site)

**4a. Crea servizio**

1. Dashboard → **New +** → **Static Site**
2. Seleziona repository: `metal40-app`
3. Click **Connect**

**4b. Configurazione**

```
Name: metal40-app

Region: Frankfurt (EU)

Branch: main

Root Directory: frontend

Build Command:
npm install && npm run build

Publish Directory:
dist

Auto-Deploy: Yes
```

**4c. Environment Variables**

```bash
VITE_API_URL=https://metal40-api.onrender.com/api
```

**4d. Deploy**

1. Click **Create Static Site**
2. Build ~1-2 minuti
3. **Live** ✅
4. URL frontend: `https://metal40-app.onrender.com`

### Step 5: Post-Deploy - Migrazione Database

**IMPORTANTE:** Esegui migrations su database produzione

1. Render → `metal40-api` → Tab **Shell**
2. Esegui:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```
3. Verifica output: "✅ Seed completato!"

### Step 6: Verifica Deploy

**Test backend:**
```bash
curl https://metal40-api.onrender.com/api/health
# Response: {"status":"ok","timestamp":"..."}
```

**Test frontend:**
1. Apri browser: `https://metal40-app.onrender.com`
2. Dovresti vedere login page

✅ **Deploy Render.com completato!**

---

## 5. SETUP AMBIENTE LOCALE - SVILUPPO

### Step 1: Clone Repository (se non già fatto)

```bash
git clone https://github.com/TUO_USERNAME/metal40-app.git
cd metal40-app
```

### Step 2: Setup Backend

```bash
cd backend

# Installa dipendenze
npm install

# Crea .env (copia da .env.example)
cp .env.example .env

# Edita .env con credenziali locali
# Usa editor (VS Code, Notepad, ecc.)
```

**.env locale:**
```bash
NODE_ENV=development

# Database - usa quello produzione Register.it
DATABASE_URL=mysql://metal40_user:PASSWORD@mysql.register.it:3306/metal40_production

# JWT
JWT_SECRET=dev_secret_min_32_caratteri_random_qui

# R2 (stesse credenziali produzione)
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=metal40-files
R2_ENDPOINT=...
R2_PUBLIC_URL=...

# Claude API
ANTHROPIC_API_KEY=sk-ant-...

# CORS
FRONTEND_URL=http://localhost:5173

PORT=3000
```

**Genera Prisma Client:**
```bash
npx prisma generate
```

**Esegui migrations (se non già fatto):**
```bash
npx prisma migrate dev --name init
```

**Seed database:**
```bash
npx prisma db seed
```

**Avvia server dev:**
```bash
npm run dev
```

Dovresti vedere:
```
✅ Database connected
🚀 Server running on port 3000
📍 Environment: development
```

**Test:**
```bash
curl http://localhost:3000/api/health
# Response: {"status":"ok"}
```

### Step 3: Setup Frontend

**Nuova finestra terminale:**

```bash
cd frontend

# Installa dipendenze
npm install

# Crea .env
cp .env.example .env

# Edita .env
```

**.env frontend:**
```bash
VITE_API_URL=http://localhost:3000/api
```

**Avvia dev server:**
```bash
npm run dev
```

Dovresti vedere:
```
VITE v5.0.0  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Test:**
1. Apri browser: `http://localhost:5173`
2. Dovresti vedere app React

### Step 4: Verifica Setup Completo

**Backend (porta 3000):**
- ✅ Server avviato
- ✅ Database connesso
- ✅ Endpoint `/api/health` risponde

**Frontend (porta 5173):**
- ✅ App React visibile
- ✅ Hot reload funzionante
- ✅ Proxy API funziona

**Database:**
- ✅ Prisma Studio: `npx prisma studio` (porta 5555)
- ✅ 3 utenti seed visibili

✅ **Ambiente locale pronto per sviluppo!**

---

## 6. COMANDI UTILI

### Backend

```bash
cd backend

# Dev server (hot reload)
npm run dev

# Build produzione
npm run build

# Start produzione
npm start

# Prisma
npx prisma generate          # Genera client
npx prisma migrate dev       # Crea migrazione
npx prisma migrate deploy    # Applica in prod
npx prisma studio            # GUI database
npx prisma db seed           # Popola DB

# Type check
npm run type-check
```

### Frontend

```bash
cd frontend

# Dev server
npm run dev

# Build produzione
npm run build

# Preview build
npm run preview
```

### Git Workflow

```bash
# Status
git status

# Add changes
git add .

# Commit
git commit -m "feat: descrizione feature"

# Push (trigger auto-deploy Render)
git push origin main

# Pull latest
git pull origin main
```

---

## 7. TROUBLESHOOTING

### Problema: Backend non si connette a MySQL

**Soluzione:**
1. Verifica `DATABASE_URL` corretto in `.env`
2. Testa connessione manuale:
   ```bash
   mysql -h mysql.register.it -u metal40_user -p
   ```
3. Verifica IP whitelisting su Register.it
4. Check firewall locale

### Problema: Porta 3000 già in uso

**Windows:**
```bash
netstat -ano | findstr :3000
taskkill /PID [numero_pid] /F
```

**Mac/Linux:**
```bash
lsof -ti:3000 | xargs kill
```

### Problema: CORS error frontend → backend

**Soluzione:**
1. Verifica `FRONTEND_URL` in backend `.env`
2. Verifica CORS config in `app.ts`
3. Check browser console per URL chiamato

### Problema: Prisma generate fallisce

**Soluzione:**
```bash
cd backend
npm uninstall @prisma/client
npm install @prisma/client
npx prisma generate
```

### Problema: Upload R2 fallisce

**Soluzione:**
1. Verifica credenziali R2 in `.env`
2. Test con AWS CLI:
   ```bash
   aws s3 ls s3://metal40-files \
     --endpoint-url https://xxxxx.r2.cloudflarestorage.com
   ```
3. Verifica CORS bucket (se necessario)

### Problema: Render deploy fallisce

**Soluzione:**
1. Check logs deploy su Render
2. Verifica `package.json` scripts corretti
3. Verifica env variables configurate
4. Check Node version compatibile (20+)

---

## 8. SICUREZZA

**IMPORTANTE - NON COMMITTARE MAI:**
- ❌ File `.env`
- ❌ File `.credentials.txt`
- ❌ Password in chiaro
- ❌ API keys

**SEMPRE:**
- ✅ Usa `.env.example` con placeholder
- ✅ `.gitignore` configurato correttamente
- ✅ Password manager per credenziali
- ✅ Rotate API keys periodicamente

---

## 9. BACKUP

**Database:**
- Register.it ha backup automatici (verifica pannello)
- Backup manuale:
  ```bash
  mysqldump -h mysql.register.it -u metal40_user -p metal40_production > backup-$(date +%Y%m%d).sql
  ```

**File R2:**
- Download bucket completo periodicamente
- Oppure abilita Cloudflare R2 versioning (a pagamento)

**Codice:**
- GitHub è già backup (push regolarmente)
- Clone locale su disco esterno (opzionale)

---

## CHECKLIST FINALE SETUP

### Register.it MySQL
- [ ] Database creato
- [ ] Credenziali annotate
- [ ] Accesso remoto configurato
- [ ] Test connessione OK

### Cloudflare R2
- [ ] Account creato
- [ ] Bucket `metal40-files` creato
- [ ] API token generato
- [ ] Credenziali annotate
- [ ] Public access abilitato

### GitHub
- [ ] Repository `metal40-app` creato
- [ ] Clone locale fatto
- [ ] `.gitignore` configurato
- [ ] Push iniziale fatto

### Render.com
- [ ] Backend `metal40-api` deployato
- [ ] Frontend `metal40-app` deployato
- [ ] Environment variables configurate
- [ ] Migrations eseguite
- [ ] Endpoint funzionanti

### Ambiente Locale
- [ ] Node.js 20+ installato
- [ ] Backend dependencies installate
- [ ] Frontend dependencies installate
- [ ] `.env` files configurati
- [ ] Backend dev server funziona
- [ ] Frontend dev server funziona
- [ ] Prisma Studio accessibile

---

✅ **Setup infrastruttura COMPLETATO!**

Ora sei pronto per iniziare lo sviluppo con Claude Code!

Vedi: **CLAUDE_CODE_INSTRUCTIONS.md**
