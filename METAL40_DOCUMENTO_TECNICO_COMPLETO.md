# 📘 METAL 4.0 - SISTEMA GESTIONE PRODUZIONE PORTE BLINDATE

## DOCUMENTO TECNICO COMPLETO PER SVILUPPO

**Versione:** 1.0  
**Data:** Febbraio 2026  
**Cliente:** Metal 4.0 S.r.l.s.  
**Developer:** Claude Code (Anthropic)  
**Architettura:** React + Node.js + MySQL (Register.it) + Render.com + Cloudflare R2

---

## 📑 INDICE

### PARTE 1: PANORAMICA PROGETTO
1.1 Obiettivo dell'applicazione  
1.2 Problema da risolvere  
1.3 Utenti e ruoli  
1.4 Funzionalità principali  

### PARTE 2: SPECIFICHE FUNZIONALI DETTAGLIATE
2.1 Gestione Ordini/Commesse  
2.2 Sistema Materiali (9 tipologie)  
2.3 Workflow Produzione (Fasi)  
2.4 Gestione Problemi  
2.5 Note e Comunicazioni  
2.6 Dashboard Ufficio Desktop  
2.7 Interfacce Tablet Operatori  
2.8 Alert e Notifiche  

### PARTE 3: ARCHITETTURA TECNICA
3.1 Stack Tecnologico  
3.2 Infrastruttura (Render + Register.it + Cloudflare)  
3.3 Schema Database MySQL Completo  
3.4 API Endpoints  
3.5 Autenticazione e Sicurezza  
3.6 File Storage (R2)  

### PARTE 4: GUIDE SETUP PASSO-PASSO
4.1 Setup Register.it (MySQL Database)  
4.2 Setup Cloudflare R2 (File Storage)  
4.3 Setup GitHub Repository  
4.4 Setup Render.com (Deploy)  
4.5 Setup Ambiente Locale  

### PARTE 5: ISTRUZIONI PER CLAUDE CODE
5.1 Fase 1-5: Setup + Backend Base  
5.2 Fase 6-10: Funzionalità Core  
5.3 Fase 11-15: Frontend Completo  
5.4 Fase 16-17: Testing + Deploy  

### PARTE 6: ESEMPI CODICE COMPLETI
6.1 Prisma Schema MySQL  
6.2 API Routes Principali  
6.3 Componenti React  
6.4 Integrazione Claude API  
6.5 Upload PDF e Foto  
6.6 WebSockets Notifiche  

### PARTE 7: TROUBLESHOOTING & CHECKLIST
7.1 Problemi Comuni  
7.2 Checklist Pre-Deploy  
7.3 Manutenzione  

---

# PARTE 1: PANORAMICA PROGETTO

## 1.1 Obiettivo dell'applicazione

**Metal 4.0 S.r.l.s.** produce porte blindate su misura con 10 dipendenti. Attualmente il tracciamento produzione avviene tramite **fogli cartacei** firmati manualmente dagli operatori ad ogni fase.

**OBIETTIVO:** Digitalizzare il processo produttivo con una web app che permetta di:
- ✅ Tracciare lo stato di avanzamento di ogni porta in tempo reale
- ✅ Gestire ordini ai fornitori (pannelli, vetri, accessori)
- ✅ Ricevere alert quando materiali non sono stati ordinati
- ✅ Segnalare e risolvere problemi in produzione
- ✅ Avere visibilità completa dall'ufficio su tutte le porte in lavorazione

## 1.2 Problema da risolvere

**SITUAZIONE ATTUALE:**
```
Ufficio conferma ordine
    ↓
Stampa 2 fogli produzione cartacei
    ↓
Operatori firmano manualmente ogni fase
    ↓
Ufficio non sa a che punto è la porta finché non chiede
    ↓
Materiali ordinati "a memoria" → rischio dimenticanze
    ↓
Problemi comunicati a voce → informazioni perse
```

**CON LA NUOVA APP:**
```
Ufficio carica PDF foglio produzione
    ↓
AI estrae automaticamente tutti i dati
    ↓
Sistema crea ordine con materiali da tracciare
    ↓
Alert automatico se materiali non ordinati
    ↓
Operatori firmano digitalmente su tablet
    ↓
Ufficio vede stato in tempo reale su dashboard
    ↓
Problemi segnalati con foto, tracciati e risolti
```

## 1.3 Utenti e ruoli

### UFFICIO (2-3 persone)
- Creano nuovi ordini caricando PDF
- Gestiscono ordini ai fornitori
- Monitorano stato produzione
- Risolvono problemi segnalati
- Accesso: **PC Desktop** (Chrome/Edge)

### OPERATORI PRODUZIONE (7-8 persone)
- Firmano digitalmente fasi completate
- Segnalano problemi con foto
- Registrano arrivo materiali
- Aggiungono note
- Accesso: **Tablet Android** (uno per reparto)

### REPARTI PRODUZIONE:
1. Punzonatura Dalcos (telaio/falsotelaio)
2. Punzonatura Euromac (scocca)
3. Piegatura
4. Saldatura/Assemblaggio
5. Rivestimento
6. Imballaggio
7. Magazzino/Ricezione

## 1.4 Funzionalità principali

### GESTIONE ORDINI:
- Upload PDF foglio produzione
- Estrazione automatica dati con Claude AI
- Tracking materiali da ordinare
- Alert giornalieri materiali non ordinati
- Timeline fasi produzione
- Note e foto per ogni ordine

### PRODUZIONE:
- Login operatore con PIN
- Visualizzazione porte da lavorare
- Completamento fasi con firma digitale
- Segnalazione problemi (3 livelli gravità)
- Possibilità aggiungere note/foto
- Registrazione arrivi materiali

### MONITORAGGIO:
- Dashboard ufficio real-time
- KPI (in produzione, urgenti, problemi, pronti)
- Filtri avanzati
- Report tempi produzione
- Storico problemi risolti

### NOTIFICHE:
- Alert apertura app (materiali da ordinare)
- Notifiche real-time (problemi bloccanti)
- Alert materiali in arrivo oggi/domani

---

# PARTE 2: SPECIFICHE FUNZIONALI DETTAGLIATE

## 2.1 Gestione Ordini/Commesse

### 2.1.1 Identificazione Ordini

**Numero conferma d'ordine:**
- Progressivo NON consecutivo (es: 7743, 7748, 7750, 7751...)
- I numeri crescono ma saltano (perché derivano da preventivi, solo alcuni diventano ordini)
- Univoco per ogni ordine

**Relazione con porte:**
- 1 ordine = 1 o più porte IDENTICHE
- Se porte diverse → conferme d'ordine separate
- Campo quantità_porte per porte identiche nello stesso ordine

### 2.1.2 Creazione Nuovo Ordine - Workflow Completo

**STEP 1: Upload PDF**
```
Ufficio accede a dashboard → [+ NUOVO ORDINE]
    ↓
Upload PDF foglio produzione (max 10MB)
    ↓
Sistema invia PDF a Claude AI
    ↓
AI estrae dati strutturati in JSON
```

**STEP 2: Verifica dati estratti**

AI estrae automaticamente:
- Numero conferma d'ordine
- Nome cliente
- Riferimento cliente (se presente)
- Data ordine
- Quantità porte (default: 1)
- Tipo telaio (4 opzioni - vedi 2.1.3)
- Colore telaio interno
- Colore telaio esterno
- Pannello interno (tipo + colore)
- Pannello esterno (tipo + colore)
- Mostrine (se presenti)
- Kit imbotte (se presente)
- Vetri con misure (se presenti)
- Maniglione speciale (se presente)

Ufficio può:
- ✅ Confermare dati estratti
- ✏️ Modificare qualsiasi campo se AI ha sbagliato
- 📄 Visualizzare PDF allegato per verifica

**STEP 3: Materiali da ordinare**

Sistema mostra automaticamente quali materiali vanno ordinati:

**Materiali A MAGAZZINO (NON tracciare):**
- Pannelli laminato
- Mostrine laminato  
- Accessori standard

**Materiali DA ORDINARE (tracciare):**
- Pannello esterno: Okoumè/MDF/PVC/Alluminio
- Pannello interno: se speciale
- Mostrine: Okoumè/MDF
- Kit imbotte
- Vetri (sopraluce/sfinestratura)
- Maniglione speciale
- Accessori custom

Per ogni materiale da ordinare:
```
☑ Materiale flaggato come necessario
  Note: [dettagli materiale]
  📅 Data consegna prevista: [AUTOMATICA +gg] [Editabile]
  🔴 ORDINE EFFETTUATO: ☐ [Da flaggare quando ordinato]
```

**STEP 4: Priorità e note**
```
☐ Urgente
  Data tassativa produzione: [__/__/____]

Note generali:
[________________________________________]
```

**STEP 5: Salvataggio**

Sistema crea:
- ✅ Record ordine in database
- ✅ Record materiali necessari
- ✅ Fasi produzione inizializzate (tutte "da_fare")
- ✅ PDF salvato su Cloudflare R2
- ✅ Log attività

### 2.1.3 Tipologie Telaio

**A) Standard con falsotelaio** (più comune)
- Falsotelaio: Punzonatura Dalcos → Piegatura → Assemblaggio
- Telaio: Punzonatura Dalcos → Piegatura → Assemblaggio
- [Se colore fuori standard] → Verniciatura

**B) Ristrutturazione L** (senza falsotelaio)
- Barre già piegate in magazzino
- Solo: Taglio → Assemblaggio
- [Se colore fuori standard] → Verniciatura

**C) Ristrutturazione Z** (senza falsotelaio)
- Barre già piegate in magazzino
- Solo: Taglio → Assemblaggio
- [Se colore fuori standard] → Verniciatura

**D) Su falsotelaio non nostro** (senza nostro falsotelaio)
- Solo telaio: Punzonatura Dalcos → Piegatura → Assemblaggio
- [Se colore fuori standard] → Verniciatura

### 2.1.4 Verniciatura Telaio

**Colori STANDARD (NO verniciatura):**
- Marrone
- Bianco

**Colori FUORI STANDARD (SÌ verniciatura esterna):**
- Tutti gli altri colori (RAL specifici, ecc.)

**Workflow verniciatura:**
```
Telaio assemblato
    ↓
Operatore registra: "Invio verniciatura" + data
    ↓
Fornitore esterno (tempi rapidi ~5-7 giorni)
    ↓
Operatore registra: "Rientro verniciatura" + data
    ↓
Telaio pronto per imballaggio finale
```

---

## 2.2 Sistema Materiali (9 tipologie)

### 2.2.1 Lista Completa Materiali Tracciabili

| # | Materiale | Tempi consegna | Quando serve | AI rileva |
|---|-----------|----------------|--------------|-----------|
| 1 | Pannello esterno Okoumè | +30 giorni | Opzionale | ✅ SÌ |
| 2 | Pannello esterno MDF | +30 giorni | Opzionale | ✅ SÌ |
| 3 | Pannello esterno PVC | +40 giorni | Opzionale | ✅ SÌ |
| 4 | Pannello esterno Alluminio | +40 giorni | Opzionale | ✅ SÌ |
| 5 | Pannello interno speciale | +30/40 gg | Raro | ✅ SÌ |
| 6 | Mostrine Okoumè | +30 giorni | Opzionale | ✅ SÌ |
| 7 | Mostrine MDF | +30 giorni | Opzionale | ✅ SÌ |
| 8 | Kit imbotte | +20 giorni | Opzionale | ✅ SÌ |
| 9 | Vetro (sopraluce/sfinest.) | +20 giorni | Opzionale | ✅ SÌ |
| 10 | Maniglione speciale | +20 giorni | Opzionale | ✅ SÌ |
| 11 | Accessori custom | Variabile | Opzionale | ❌ Manuale |

**MATERIALI A MAGAZZINO (NON tracciare):**
- Pannelli laminato (tutti i colori)
- Mostrine laminato
- Accessori standard (cerniere, serrature, defender, spioncini standard)

### 2.2.2 Calcolo Automatico Date Consegna

**Regole:**
```javascript
// Data ordine = data creazione ordine in app

if (materiale === 'okoume' || materiale === 'mdf') {
  data_consegna_prevista = data_ordine + 30 giorni;
}

if (materiale === 'pvc' || materiale === 'alluminio') {
  data_consegna_prevista = data_ordine + 40 giorni;
}

if (materiale === 'vetro' || materiale === 'maniglione' || materiale === 'kit_imbotte') {
  data_consegna_prevista = data_ordine + 20 giorni;
}

// Tutte le date sono EDITABILI dall'ufficio
```

### 2.2.3 Stati Materiale

**1. NON ORDINATO** 🔴
- Materiale flaggato come necessario
- Flag "ordine_effettuato" = false
- Compare in alert giornaliero ufficio

**2. ORDINATO - IN ATTESA** 🟡
- Flag "ordine_effettuato" = true
- Data ordine effettivo registrata
- Data consegna prevista impostata
- NON compare più in alert
- Compare in "materiali in arrivo" 7 giorni prima

**3. ARRIVATO** 🟢
- Data arrivo effettivo registrata
- Porta può procedere in produzione
- Notifica automatica a ufficio

### 2.2.4 Gestione Ordine Materiali (Ufficio)

**Segnare materiale come ordinato:**
```
Ufficio accede a ordine → Materiali
    ↓
Click su materiale NON ORDINATO
    ↓
[SEGNA ORDINATO]
    ↓
Popup conferma:
  - Data ordine effettivo: [oggi] (editabile)
  - Data consegna prevista: [auto +gg] (editabile)
  - Note ordine: [campo libero]
    ↓
[CONFERMA]
    ↓
Sistema registra:
  - ordine_effettuato = true
  - data_ordine_effettivo
  - data_consegna_prevista
  - Rimuove da alert
  - Log attività
```

**Modificare data consegna:**
```
Materiale ordinato → [MODIFICA DATA]
    ↓
Nuova data consegna: [__/__/____]
    ↓
Sistema aggiorna + log
```

**Registrare arrivo materiale:**

Accessibile da:
- Ufficio (desktop)
- Qualsiasi operatore (tablet - menù ordine)

```
Ordine → Materiali → [SEGNA ARRIVATO]
    ↓
Selezione materiale arrivato
    ↓
Data arrivo: [oggi] (editabile)
Note: [opzionale]
    ↓
[REGISTRA ARRIVO]
    ↓
Sistema:
  - arrivato = true
  - data_arrivo_effettivo
  - 🔔 Notifica ufficio "Materiale X arrivato"
  - Aggiorna stato materiali ovunque
  - Log attività
```

### 2.2.5 Alert Materiali

**Alert giornaliero apertura app (Ufficio):**

Popup modale PRIMA della dashboard:
```
🔴 MATERIALI DA ORDINARE (X ordini)

Ordine 7743 - ARREDO NORBA
• Pannello Alluminio - NON ORDINATO
• Vetro 1075x665 - NON ORDINATO
• Maniglione Hoppe - NON ORDINATO
  [GESTISCI] [SEGNA TUTTI ORDINATI]

Ordine 7746 - LUDOVICO
• Pannello PVC - NON ORDINATO
  [GESTISCI] [SEGNA ORDINATO]
```

**Alert materiali in arrivo (7 giorni prima):**
```
📦 MATERIALI IN ARRIVO PROSSIMAMENTE

Ordine 7750 - SOLIN SRL
• Pannello Okoumè
  Previsto: 14/03/2026 (tra 3 giorni)
  [SEGNA ARRIVATO]
```

### 2.2.6 Logica Avvio Produzione

**Regola scocca/rivestimento:**

La scocca può essere lavorata SOLO se:
- Tutti i materiali necessari sono ARRIVATI
- OPPURE manca ≤7 giorni alla consegna prevista

```javascript
function puoIniziareRivestimento(ordine) {
  const materialiNecessari = ordine.materiali.filter(m => m.necessario);
  
  for (let materiale of materialiNecessari) {
    // Materiale arrivato → OK
    if (materiale.arrivato === true) continue;
    
    // Calcola giorni mancanti
    const giorniMancanti = calcolaGiorni(oggi, materiale.data_consegna_prevista);
    
    // Se manca >7 giorni → BLOCCA
    if (giorniMancanti > 7) {
      return {
        puo_iniziare: false,
        motivo: `In attesa ${materiale.tipo} (arr. ${materiale.data_consegna_prevista})`
      };
    }
  }
  
  return { puo_iniziare: true };
}
```

**Esempio pratico:**
```
Ordine con:
- Pannello Okoumè (arrivo previsto 14/03)
- Mostrine Okoumè (arrivo previsto 14/03)
- Kit imbotte (arrivo previsto 05/03)

Oggi: 13/02
Fase rivestimento: NON può iniziare (>7 giorni)

Dal 28/02: PUÒ iniziare rivestimento interno
Dal 07/03: PUÒ iniziare rivestimento esterno (tutti ≤7gg)
```

### 2.2.7 Relazione Mostrine - Pannello Esterno

**Logica automatica AI:**
```
SE pannello_esterno = "Okoumè"
  → Auto-flag: ☑ Mostrine Okoumè
  → Data consegna: stessa del pannello (+30gg)

SE pannello_esterno = "MDF"
  → Auto-flag: ☑ Mostrine MDF
  → Data consegna: stessa del pannello (+30gg)

SE pannello_esterno = "Laminato" o "PVC" o "Alluminio"
  → Mostrine laminato (magazzino)
  → NON flaggare mostrine da ordinare
```

Ufficio può sempre:
- Modificare flag auto
- Cambiare date
- Aggiungere note

### 2.2.8 Kit Imbotte - Quando Serve

**Definizione:**
Kit per rivestire spessore muro esterno (lato esterno telaio).

**Quando serve:**
- Solitamente con pannello esterno laminato (condominii)
- A volte con Okoumè/MDF con lavorazioni particolari
- SEMPRE opzionale (indicato nel PDF)

**AI rileva:** Campo "Kit imbotte" nel PDF → auto-flag se presente

---

## 2.3 Workflow Produzione (Fasi)

### 2.3.1 Fasi Produzione Complete

**PERCORSO A: TELAIO/FALSOTELAIO**

Per tipo telaio "Standard con falsotelaio":
```
1. Punzonatura Dalcos - Falsotelaio
2. Piegatura - Falsotelaio
3. Punzonatura Dalcos - Telaio
4. Piegatura - Telaio
5. Assemblaggio telaio + falsotelaio
6. [SE colore fuori standard] Invio verniciatura
7. [SE colore fuori standard] Rientro verniciatura
```

Per tipo telaio "Ristrutturazione L/Z":
```
1. Taglio barre (già piegate)
2. Assemblaggio telaio
3. [SE colore fuori standard] Invio verniciatura
4. [SE colore fuori standard] Rientro verniciatura
```

Per tipo telaio "Su falsotelaio non nostro":
```
1. Punzonatura Dalcos - Telaio
2. Piegatura - Telaio
3. Assemblaggio telaio
4. [SE colore fuori standard] Invio verniciatura
5. [SE colore fuori standard] Rientro verniciatura
```

**PERCORSO B: SCOCCA**
```
1. Punzonatura Euromac - Scocca
2. Piegatura accessori scocca
3. Saldatura/Assemblaggio scocca
4. Rivestimento interno (pannello interno)
5. Rivestimento esterno (pannello esterno)
```

**FASE FINALE: ASSEMBLAGGIO E SPEDIZIONE**
```
6. Prova in telaio e imballaggio (scocca + telaio)
7. Riconsegna foglio in ufficio (pronta spedizione)
```

### 2.3.2 Stati Fase

**Ogni fase può essere:**
- ☐ **DA FARE** (default iniziale)
- ✅ **COMPLETATA** (firmata da operatore)

**Dati registrati al completamento:**
```
- Completata da: [user_id operatore]
- Data/ora completamento: [timestamp]
- Note: [opzionale]
- Foto: [array path] [opzionale]
```

### 2.3.3 Inizializzazione Fasi

**Quando si crea ordine, sistema crea automaticamente le fasi corrette in base al tipo telaio:**

```javascript
// Esempio tipo telaio "Standard con falsotelaio"
const fasiTelaio = [
  'punzonatura_dalcos_falsotelaio',
  'piegatura_falsotelaio',
  'punzonatura_dalcos_telaio',
  'piegatura_telaio',
  'assemblaggio_telaio',
];

// Se colore fuori standard, aggiungi:
if (ordine.verniciatura_necessaria) {
  fasiTelaio.push('invio_verniciatura');
  fasiTelaio.push('rientro_verniciatura');
}

// Fasi scocca (sempre uguali)
const fasiScocca = [
  'punzonatura_euromac_scocca',
  'piegatura_accessori',
  'saldatura_assemblaggio',
  'rivestimento_interno',
  'rivestimento_esterno',
];

// Fasi finali (sempre uguali)
const fasiFinali = [
  'imballaggio',
  'riconsegna_foglio',
];

// Crea tutte le fasi in database
const tutteFasi = [...fasiTelaio, ...fasiScocca, ...fasiFinali];
for (let fase of tutteFasi) {
  await prisma.fasi_produzione.create({
    data: {
      ordine_id: ordine.id,
      nome_fase: fase,
      stato: 'da_fare',
    }
  });
}
```

### 2.3.4 Completamento Fase (Operatore)

**Workflow tablet:**
```
Operatore login con PIN
    ↓
Vede lista porte con "sue" fasi da fare
    ↓
Click su ordine → [APRI ORDINE]
    ↓
Vede dettagli + azioni
    ↓
Click [COMPLETA FASE]
    ↓
Popup conferma:
  - Fase: Punzonatura Euromac - Scocca
  - Operatore: Mario Rossi
  - Data/ora: 13/02/2026 10:45
  - Note (opzionale): [_________]
  - Foto (opzionale): [+ SCATTA]
    ↓
[CONFERMA]
    ↓
Sistema:
  - Aggiorna stato fase → "completata"
  - Registra operatore + timestamp
  - Salva note/foto se presenti
  - Ordine passa in sezione "Completati" dell'operatore
  - Ordine diventa visibile per operatore FASE SUCCESSIVA
  - Log attività
```

**Regole completamento:**
- ✅ Solo operatore LOGGATO può firmare
- ✅ Operatore può lavorare su più reparti
- ✅ Solo chi completa può firmare quella fase
- ✅ Timestamp automatico (non modificabile)

### 2.3.5 Visualizzazione Fasi (Operatori Tablet)

**Filtro automatico "Le mie fasi":**

Operatore vede SOLO ordini dove la PROSSIMA fase da fare è di sua competenza.

```javascript
// Esempio: Mario Rossi - Punzonatura Euromac
// Vede solo ordini dove:
// - Fase "punzonatura_euromac_scocca" = "da_fare"
// - Tutte le fasi PRECEDENTI = "completata"

const mieFasi = ['punzonatura_euromac_scocca'];

const ordiniDaLavorare = ordini.filter(ordine => {
  const fasiOrdine = ordine.fasi.sort(by_sequenza);
  const prossimaFaseDaFare = fasiOrdine.find(f => f.stato === 'da_fare');
  
  return mieFasi.includes(prossimaFaseDaFare.nome_fase);
});
```

**Ordinamento lista:**
1. 🔴 Urgenti (data tassativa) → sempre in alto
2. Ordini con tutti materiali disponibili
3. Ordini con materiali in arrivo ≤7 giorni
4. Altri in ordine cronologico

**Tab "Completati":**
- Storico fasi firmate dall'operatore
- Ultimi 7 giorni visibili
- Possibilità cercare per data/numero ordine
- Dettagli completamento (note/foto)

---

## 2.4 Gestione Problemi

### 2.4.1 Tipologie Problema

**Tipi predefiniti:**
- Materiale difettoso
- Misure non corrispondenti
- Macchinario guasto
- Manca materiale
- Altro (campo libero)

**Livelli di gravità:**
- 🟢 **BASSA** - Proseguo comunque
  - Es: "Piccolo graffio pannello - verificare con cliente"
  - Produzione continua
  
- 🟡 **MEDIA** - Serve intervento
  - Es: "Telaio non perfettamente squadrato - serve rilavoro"
  - Produzione continua ma serve azione
  
- 🔴 **ALTA - BLOCCANTE**
  - Es: "Lamiera difettosa impossibile piegare"
  - Produzione FERMA per quell'ordine
  - Alert immediato ufficio

### 2.4.2 Segnalazione Problema (Operatore)

**Workflow tablet:**
```
Operatore su ordine → [SEGNALA PROBLEMA]
    ↓
Form segnalazione:
  - Ordine: 7750 - SOLIN SRL
  - Fase attuale: Piegatura
  - Operatore: Giuseppe Verdi
  
  Tipo problema:
  ○ Materiale difettoso
  ○ Misure non corrispondenti  
  ○ Macchinario guasto
  ○ Manca materiale
  ○ Altro
  
  Descrizione:
  [________________________________]
  [________________________________]
  
  Foto (consigliato):
  [+ SCATTA FOTO]
  
  Gravità:
  ○ Bassa - Proseguo
  ○ Media - Serve intervento
  ○ Alta - BLOCCANTE
    ↓
[INVIA SEGNALAZIONE]
    ↓
Sistema:
  - Crea record problema
  - Timestamp + operatore
  - SE bloccante → ordine.stato = "bloccato"
  - 🚨 Alert IMMEDIATO ufficio (notifica real-time)
  - Badge rosso su ordine
  - Log attività
```

**Notifica ufficio (popup):**
```
🔴 PROBLEMA BLOCCANTE SEGNALATO

Ordine: 7750 - SOLIN SRL
Fase: Piegatura
Segnalato da: Giuseppe Verdi
Ora: 13/02/2026 11:20

Tipo: Materiale difettoso
"Lamiera con bolla d'aria - impossibile piegare"

📷 2 foto allegate

[VEDI PROBLEMA] [RISOLVI]
```

### 2.4.3 Risoluzione Problema

**Chi può risolvere:**
- ✅ Ufficio (sempre)
- ✅ Operatore che ha segnalato il problema

**Workflow risoluzione:**
```
Dashboard problemi → Click problema → [RISOLVI PROBLEMA]
    ↓
Form risoluzione:
  - Problema: #045 - Ord. 7750 Piegatura
  - Segnalato da: Giuseppe Verdi il 13/02 11:20
  - Descrizione: "Lamiera bolla d'aria..."
  - Foto segnalazione: [visualizza]
  
  Descrizione risoluzione:
  [Es: "Sostituita lamiera - preso da stock]
  [ordine 7748 - riprogrammata punzonatura]
  [per 7748 domani"]
  [________________________________]
  
  Foto risoluzione (opzionale):
  [+ SCATTA FOTO]
  
  Risolto da: Mario Rossi (ufficio)
  Data: 13/02/2026 14:30
    ↓
[SEGNA RISOLTO]
    ↓
Sistema:
  - problema.risolto = true
  - Timestamp + user risoluzione
  - Descrizione + foto risoluzione
  - SE era bloccante → ordine.stato = "in_produzione"
  - Rimuove badge problema da ordine
  - Notifica operatore che aveva segnalato
  - Log attività
```

### 2.4.4 Storico Problemi

**Ogni problema traccia:**
```
PROBLEMA #045
├─ SEGNALAZIONE
│  ├─ Ordine: 7750 - SOLIN SRL
│  ├─ Fase: Piegatura
│  ├─ Segnalato da: Giuseppe Verdi
│  ├─ Data: 13/02/2026 11:20
│  ├─ Tipo: Materiale difettoso
│  ├─ Gravità: ALTA - BLOCCANTE
│  ├─ Descrizione: "Lamiera con bolla..."
│  └─ Foto: [IMG_001.jpg, IMG_002.jpg]
│
└─ RISOLUZIONE
   ├─ Risolto da: Mario Rossi (ufficio)
   ├─ Data: 13/02/2026 14:30
   ├─ Descrizione: "Sostituita lamiera..."
   ├─ Foto: [IMG_003.jpg]
   └─ Tempo risoluzione: 3h 10min
```

**Dashboard problemi (Ufficio):**

Filtri:
- [●Aperti] [○Risolti] [○Tutti]
- Per gravità: [Tutti] [Bloccanti] [Medi] [Bassi]
- Per ordine
- Per operatore
- Per data

Report:
- Problemi totali periodo
- Tempo medio risoluzione
- Tipologie più frequenti
- Operatori con più segnalazioni (non negativo! significa attenzione)

---

## 2.5 Note e Comunicazioni

### 2.5.1 Sistema Note per Ordine

**Ogni ordine può avere note da:**
- Ufficio
- Operatori

**Caratteristiche nota:**
```
- Testo libero (max 1000 caratteri)
- Autore (user_id + nome)
- Timestamp
- Foto allegate (array path)
- Visibile a TUTTI
```

### 2.5.2 Aggiungere Nota

**Da ufficio (desktop):**
```
Dettaglio ordine → Sezione NOTE → [+ AGGIUNGI NOTA]
    ↓
Testo: [_________________________________]
Foto: [+ CARICA/SCATTA]
    ↓
[SALVA NOTA]
```

**Da tablet (operatore):**
```
Ordine → [AGGIUNGI NOTA]
    ↓
Testo: [_________________________________]
Foto: [+ SCATTA FOTO]
    ↓
[SALVA NOTA]
```

**Sistema registra:**
- nota.testo
- nota.creato_da = user_id
- nota.created_at = timestamp
- nota.foto_paths = [...]
- Log attività

### 2.5.3 Visualizzazione Note

**Sezione note ordine:**
```
💬 NOTE E COMUNICAZIONI (3)

┌────────────────────────────────────┐
│ 👤 Mario Rossi (Punz. Euromac)    │
│ 📅 13/02/2026 - 10:15              │
│                                    │
│ "Lamiera aveva piccola piega       │
│  in angolo - verificato con        │
│  Giuseppe, procedo ugualmente"     │
│                                    │
│ 📷 [Foto allegata]                 │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ 👤 Ufficio (Giuseppe)              │
│ 📅 12/02/2026 - 15:30              │
│                                    │
│ "Cliente ha confermato colore      │
│  telaio RAL 7016"                  │
└────────────────────────────────────┘

[+ AGGIUNGI NOTA]
```

**Ordine cronologico:** Più recente in alto

**NO sistema chat:** Note sono asincrone, non conversazioni real-time

---

## 2.6 Dashboard Ufficio Desktop

### 2.6.1 Layout Principale

**Header:**
```
┌──────────────────────────────────────────────────────┐
│ 🏢 METAL 4.0 - PRODUZIONE    👤 Giuseppe    🔔(3)   │
└──────────────────────────────────────────────────────┘
```

**KPI Row:**
```
┌────────────┬────────────┬────────────┬────────────┐
│ 📋 IN PROD │ 🔴 URGENTI │ ⚠️ PROBLEMI │ ✅ PRONTE  │
│     12     │      3     │      2     │      2     │
└────────────┴────────────┴────────────┴────────────┘
```

**Filtri e Ricerca:**
```
🔍 [Cerca ordine/cliente...]    📅 [Periodo ▼]

FILTRI: [●Tutti] [○Urgenti] [○Bloccati] [○Da ordinare] [○Pronte]
```

**Lista Ordini (Table):**
```
┌──────┬────────────┬──────────────────┬──────────────┬────────┬─────────┐
│Conf. │Cliente     │Stato Produzione  │Materiali     │Giorni  │Azioni   │
├──────┼────────────┼──────────────────┼──────────────┼────────┼─────────┤
│      │            │                  │              │        │         │
│ 🔴   │SOLIN SRL   │⚠️ PROBLEMA      │🟡 Okoumè     │3 gg    │[APRI]   │
│7750  │            │🔴 Piegatura      │  arr.14/03   │🔴URG   │[EDIT]   │
│      │Rif: GINO   │  BLOCCATA        │              │20/02   │         │
│      │            │                  │              │        │         │
├──────┼────────────┼──────────────────┼──────────────┼────────┼─────────┤
│      │ARREDO      │🟡 Punz. Euromac │🔴 Alluminio  │3 gg    │[APRI]   │
│7743  │NORBA       │  compl. 13/02    │  NON ORD.    │        │[EDIT]   │
│      │Rif: CICI.  │🔴 Piegatura      │🟡 Vetro arr. │        │         │
│      │            │  DA FARE         │🟡 Manigl.arr.│        │         │
│      │            │                  │              │        │         │
├──────┼────────────┼──────────────────┼──────────────┼────────┼─────────┤
│      │PROGETTO    │✅ Pronta         │✅ Tutto OK   │4 gg    │[APRI]   │
│7748  │CASA SRLS   │  Imballata 12/02 │              │        │[SEGNA   │
│      │Rif: LOPS   │                  │              │        │ SPED.]  │
└──────┴────────────┴──────────────────┴──────────────┴────────┴─────────┘
```

**Legenda colori:**
- 🔴 Urgente / Problema / Non ordinato
- 🟡 In corso / In attesa materiali
- ✅ Completato / Arrivato
- ⏸️ In attesa (fase futura)

### 2.6.2 Alert Apertura App (Popup Modale)

**All'accesso mattutino, PRIMA della dashboard:**

```
┌───────────────────────────────────────────────────┐
│  🔔 NOTIFICHE - Giovedì 13 Febbraio 2026          │
├───────────────────────────────────────────────────┤
│                                                    │
│  🔴 MATERIALI DA ORDINARE (4 ordini)              │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ 7743 - ARREDO NORBA                          │ │
│  │ • Pannello Alluminio - NON ORDINATO          │ │
│  │ • Vetro 1075x665 - NON ORDINATO              │ │
│  │ • Maniglione Hoppe - NON ORDINATO            │ │
│  │        [GESTISCI] [SEGNA ORDINATI]           │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  ⚠️ PROBLEMI SEGNALATI (2)                        │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ 🔴 BLOCCANTE - 7750 SOLIN SRL                │ │
│  │ Piegatura - Materiale difettoso              │ │
│  │ Segnalato da: Giuseppe Verdi - 13/02 11:20   │ │
│  │        [VEDI PROBLEMA] [RISOLVI]             │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  📦 MATERIALI IN ARRIVO OGGI/DOMANI (1)           │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ 7750 - SOLIN SRL                             │ │
│  │ Pannello Okoumè - Previsto: 14/02 (domani)   │ │
│  │        [SEGNA ARRIVATO]                      │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│      [CHIUDI NOTIFICHE] [VAI A DASHBOARD]         │
└───────────────────────────────────────────────────┘
```

**Logic alert:**
```javascript
// All'accesso ufficio (ogni giorno)
const alert = {
  materialiDaOrdinare: [],
  problemiAperti: [],
  materialiInArrivo: [],
};

// 1. Materiali da ordinare
ordini.forEach(ordine => {
  ordine.materiali.forEach(mat => {
    if (mat.necessario && !mat.ordine_effettuato) {
      alert.materialiDaOrdinare.push({ordine, materiale: mat});
    }
  });
});

// 2. Problemi aperti
const problemi = await db.problemi.findMany({
  where: { risolto: false },
  orderBy: { gravita: 'desc' } // bloccanti prima
});
alert.problemiAperti = problemi;

// 3. Materiali in arrivo oggi/domani
ordini.forEach(ordine => {
  ordine.materiali.forEach(mat => {
    if (mat.ordine_effettuato && !mat.arrivato) {
      const giorni = calcolaGiorni(oggi, mat.data_consegna_prevista);
      if (giorni <= 1) {
        alert.materialiInArrivo.push({ordine, materiale: mat});
      }
    }
  });
});

// Mostra popup SE c'è almeno 1 alert
if (alert.materialiDaOrdinare.length > 0 || 
    alert.problemiAperti.length > 0 || 
    alert.materialiInArrivo.length > 0) {
  mostraAlertPopup(alert);
}
```

### 2.6.3 Dettaglio Ordine (Click [APRI])

**Layout completo:**

```
┌─────────────────────────────────────────────────────┐
│ Conf. 7743 - ARREDO NORBA              [✕ Chiudi]  │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ┌─────────────────────┐  ┌────────────────────────┐│
│ │ 📋 INFO ORDINE      │  │ 📦 MATERIALI           ││
│ │                     │  │                        ││
│ │ Cliente: ARREDO     │  │ Pannello interno:      ││
│ │ Rif: CICIRIELLO     │  │ ✅ Laminato (magazz.) ││
│ │ Data: 10/02/2026    │  │                        ││
│ │ Giorni: 3           │  │ Pannello esterno:      ││
│ │                     │  │ 🔴 Alluminio NON ORD. ││
│ │ Tipo telaio:        │  │  [SEGNA ORDINATO]      ││
│ │ • Ridotto L         │  │                        ││
│ │   + sopraluce       │  │ Vetro sopraluce:       ││
│ │ • Marrone/Marrone   │  │ 🟡 1075x665 Ordinato  ││
│ │ • NO verniciatura   │  │    Prev: 02/03/2026    ││
│ │                     │  │  [SEGNA ARRIVATO]      ││
│ │ Priorità: ○ Normale │  │  [MODIFICA DATA]       ││
│ │ [☐ Urgente]         │  │                        ││
│ │                     │  │ Maniglione:            ││
│ │ 📄 [VEDI PDF]       │  │ 🟡 Hoppe E5726        ││
│ └─────────────────────┘  │    Prev: 02/03/2026    ││
│                          │  [SEGNA ARRIVATO]      ││
│                          └────────────────────────┘│
│                                                      │
│ ┌──────────────────────────────────────────────────┐│
│ │ 🔄 TIMELINE PRODUZIONE                           ││
│ │                                                  ││
│ │ ✅ Punzonatura Dalcos - Telaio                  ││
│ │    Completato: 11/02/2026 10:30 - G.Verdi      ││
│ │                                                  ││
│ │ ✅ Piegatura - Telaio                           ││
│ │    Completato: 11/02/2026 14:15 - M.Rossi      ││
│ │                                                  ││
│ │ ✅ Assemblaggio telaio                          ││
│ │    Completato: 12/02/2026 09:00 - G.Verdi      ││
│ │                                                  ││
│ │ ✅ Punzonatura Euromac - Scocca                 ││
│ │    Completato: 13/02/2026 10:45 - M.Rossi      ││
│ │    💬 "Lamiera piega angolo - procedo" + 📷    ││
│ │                                                  ││
│ │ 🔴 Piegatura accessori - DA FARE                ││
│ │    In attesa da: 2 ore                          ││
│ │    ⚠️ Materiali: Alluminio NON ordinato        ││
│ │                                                  ││
│ │ ⏸️ Saldatura - IN ATTESA                        ││
│ │ ⏸️ Rivestimento interno - IN ATTESA             ││
│ │ ⏸️ Rivestimento esterno - IN ATTESA (Alluminio)││
│ │ ⏸️ Imballaggio - IN ATTESA                      ││
│ │ ⏸️ Riconsegna foglio - IN ATTESA                ││
│ └──────────────────────────────────────────────────┘│
│                                                      │
│ ┌─────────────────────┐  ┌────────────────────────┐│
│ │ 💬 NOTE (2)         │  │ ⚠️ PROBLEMI (0)        ││
│ │                     │  │                        ││
│ │ 👤 M.Rossi (Punz.) │  │ Nessun problema        ││
│ │ 📅 13/02 - 10:15    │  │ segnalato              ││
│ │ "Lamiera piega..."  │  │                        ││
│ │ 📷 [Foto]           │  │                        ││
│ │                     │  │                        ││
│ │ 👤 Ufficio          │  │                        ││
│ │ 📅 12/02 - 15:30    │  │                        ││
│ │ "Cliente RAL 7016"  │  │                        ││
│ │                     │  │                        ││
│ │ [+ AGGIUNGI NOTA]   │  │                        ││
│ └─────────────────────┘  └────────────────────────┘│
│                                                      │
│  [MODIFICA ORDINE]  [ELIMINA]  [STAMPA REPORT]     │
└─────────────────────────────────────────────────────┘
```

### 2.6.4 Tab Dedicati

**Navigation tabs:**
```
[Dashboard] [⚠️ Problemi] [📦 Materiali] [📊 Report]
```

**TAB PROBLEMI:**
- Filtri: Aperti / Risolti / Tutti
- Lista problemi con dettagli
- Click → Dettaglio problema
- Azioni: [RISOLVI] [VEDI ORDINE]

**TAB MATERIALI:**
- Filtri: Da ordinare / Ordinati in attesa / In arrivo oggi/domani
- Tipo materiale: Tutti / Pannelli / Mostrine / Kit imbotte / Vetri / Maniglioni
- Azioni rapide: [SEGNA ORDINATO] [SEGNA ARRIVATO]

**TAB REPORT:**
- Periodo selezionabile
- KPI produzione (porte completate, tempi medi)
- Colli di bottiglia (fase più lenta)
- Problemi (totali, risolti, aperti, tempi risoluzione)
- Export PDF / Excel

### 2.6.5 Notifiche Real-Time

**Badge campanello header:**
```
🔔 (3)  ← numero notifiche non lette
```

**Click → Dropdown:**
```
┌────────────────────────────────────────┐
│ 🔔 NOTIFICHE (3)      [Segna lette]   │
├────────────────────────────────────────┤
│                                         │
│ 🔴 NUOVO PROBLEMA BLOCCANTE            │
│ Ord. 7750 - Piegatura                  │
│ 2 minuti fa                            │
│ [VISUALIZZA]                            │
│                                         │
│ ───────────────────────────────────    │
│                                         │
│ 📦 Materiale arrivato                  │
│ Ord. 7743 - Vetro sopraluce            │
│ 30 minuti fa                           │
│ [VISUALIZZA]                            │
│                                         │
│ ───────────────────────────────────    │
│                                         │
│ ✅ Fase completata                     │
│ Ord. 7746 - Saldatura                  │
│ 1 ora fa                               │
│ [VISUALIZZA]                            │
└────────────────────────────────────────┘
```

**Tipi notifiche:**
- 🔴 Problema segnalato (ALTA priorità se bloccante)
- 📦 Materiale arrivato
- ✅ Fase completata
- ⚠️ Problema risolto
- 📝 Nuova nota aggiunta

**Tecnologia: WebSockets (Socket.io)**
```javascript
// Server → Client ufficio
socket.emit('problema_segnalato', {
  ordine_id: 7750,
  gravita: 'alta_bloccante',
  descrizione: '...',
});

socket.emit('materiale_arrivato', {
  ordine_id: 7743,
  materiale: 'Vetro sopraluce',
});

socket.emit('fase_completata', {
  ordine_id: 7746,
  fase: 'Saldatura',
  operatore: 'Mario Rossi',
});
```

---

## 2.7 Interfacce Tablet Operatori

### 2.7.1 Login Operatore

**Schermata login:**
```
┌─────────────────────────────────┐
│                                  │
│    🔧 METAL 4.0 PRODUZIONE      │
│                                  │
│  Operatore:                      │
│  ▼ Mario Rossi                   │
│                                  │
│  PIN: ●●●●                       │
│                                  │
│      [ACCEDI]                    │
│                                  │
└─────────────────────────────────┘
```

**Caratteristiche:**
- Lista dropdown con tutti gli operatori
- PIN a 4 cifre
- Nessuna password complessa (ambiente produzione)
- Session timeout: 8 ore (poi re-login)

### 2.7.2 Schermata Principale Operatore

**Per operatori PUNZONATURA (vedono tutti gli ordini da fare):**

```
┌─────────────────────────────────────────────┐
│ 👤 Mario Rossi - Punzonatura Euromac        │
│ 🕐 13/02/2026 - 09:30                       │
├─────────────────────────────────────────────┤
│ TAB: [🔴 Da fare (4)] [✅ Completati (12)]  │
├─────────────────────────────────────────────┤
│                                              │
│ 🔴 DA LAVORARE - PUNZONATURA EUROMAC        │
│                                              │
│ 🔍 [Cerca ordine...]                        │
│                                              │
│ ┌──────────────────────────────────────────┐│
│ │🔴 URGENTE - Data tassativa: 20/02/2026  ││
│ │                                          ││
│ │ Conf. 7750 - SOLIN SRL                  ││
│ │ 🔴 Punzonatura Euromac - Scocca         ││
│ │                                          ││
│ │ 📦 Materiali:                           ││
│ │  • Pannello Okoumè: 🟡 Arriva 14/03    ││
│ │                                          ││
│ │ ⏰ In attesa da: 1 giorno               ││
│ │                                          ││
│ │       [APRI ORDINE]                      ││
│ └──────────────────────────────────────────┘│
│                                              │
│ ┌──────────────────────────────────────────┐│
│ │ Conf. 7743 - ARREDO NORBA               ││
│ │ 🔴 Punzonatura Euromac - Scocca         ││
│ │                                          ││
│ │ 📦 Materiali:                           ││
│ │  • Pannello Alluminio: 🔴 Non ordinato ││
│ │  • Vetro: 🟡 Arriva 02/03              ││
│ │                                          ││
│ │ ⚠️ Materiali non ordinati               ││
│ │                                          ││
│ │       [APRI ORDINE]                      ││
│ └──────────────────────────────────────────┘│
│                                              │
└─────────────────────────────────────────────┘
```

**Per altri operatori (es: Saldatura):**

```
┌─────────────────────────────────────────────┐
│ 👤 Giuseppe Verdi - Saldatura               │
├─────────────────────────────────────────────┤
│ TAB: [🔴 Da fare (2)]                       │
├─────────────────────────────────────────────┤
│                                              │
│ 🔴 DA LAVORARE - SALDATURA                  │
│                                              │
│ ┌──────────────────────────────────────────┐│
│ │ Conf. 7746 - LUDOVICO TARANTO           ││
│ │ 🔴 Saldatura/Assemblaggio               ││
│ │                                          ││
│ │ 📦 Materiali:                           ││
│ │  • Pannello PVC: 🟡 Arriva 24/03       ││
│ │                                          ││
│ │ ✅ Può procedere (manca 1 settimana)    ││
│ │                                          ││
│ │       [APRI ORDINE]                      ││
│ └──────────────────────────────────────────┘│
│                                              │
└─────────────────────────────────────────────┘
```

**Ordinamento automatico:**
1. 🔴 Urgenti (data tassativa) → sempre in alto
2. Materiali tutti disponibili
3. Materiali in arrivo ≤7 giorni
4. Altri cronologici

### 2.7.3 Dettaglio Ordine Tablet

```
┌─────────────────────────────────────────────┐
│ Conf. 7743 - ARREDO NORBA                   │
│ 🔴 Punzonatura Euromac - Scocca             │
├─────────────────────────────────────────────┤
│                                              │
│ 📄 FOGLIO PRODUZIONE:                       │
│    [📱 Visualizza PDF]                      │
│                                              │
│ 📦 STATO MATERIALI:                         │
│  • Pannello interno: ✅ Laminato (magazz.) │
│  • Pannello esterno: 🔴 Alluminio NON ORD. │
│  • Vetro sopraluce: 🟡 Ordinato arr. 02/03 │
│  • Maniglione: 🟡 Ordinato arr. 02/03      │
│                                              │
│ ⚠️ Attenzione: Pannello esterno non ordinato│
│                                              │
│ 💬 NOTE ORDINE (2):                         │
│    [Visualizza note e foto]                 │
│                                              │
├─────────────────────────────────────────────┤
│ AZIONI                                       │
│                                              │
│ ✅ [COMPLETA FASE]                          │
│                                              │
│ ⚠️ [SEGNALA PROBLEMA]                       │
│                                              │
│ 📝 [AGGIUNGI NOTA]                          │
│                                              │
│ 📷 [SCATTA FOTO]                            │
│                                              │
│ 📦 [REGISTRA ARRIVO MATERIALE]              │
│                                              │
│       [◀ INDIETRO]                          │
│                                              │
└─────────────────────────────────────────────┘
```

### 2.7.4 Completamento Fase

```
┌─────────────────────────────────────────────┐
│ ✅ CONFERMA COMPLETAMENTO                   │
├─────────────────────────────────────────────┤
│                                              │
│ Stai completando:                            │
│ Punzonatura Euromac - Scocca                │
│                                              │
│ Ordine: 7743 - ARREDO NORBA                 │
│                                              │
│ Operatore: Mario Rossi                      │
│ Data/ora: 13/02/2026 - 10:45                │
│                                              │
│ 📝 Note (facoltativo):                      │
│ [______________________________________]     │
│ [______________________________________]     │
│                                              │
│ 📷 Foto (facoltativo):                      │
│  [Nessuna foto]  [+ SCATTA]                 │
│                                              │
│                                              │
│  [✅ CONFERMA]    [ANNULLA]                 │
│                                              │
└─────────────────────────────────────────────┘
```

**Dopo conferma:**
- ✅ Fase segnata "completata"
- 📅 Timestamp registrato
- 👤 Operatore registrato
- 📝 Note/foto salvate
- ➡️ Ordine passa in tab "Completati"
- ➡️ Ordine appare al PROSSIMO operatore

### 2.7.5 Segnalazione Problema

```
┌─────────────────────────────────────────────┐
│ ⚠️ SEGNALA PROBLEMA                         │
├─────────────────────────────────────────────┤
│                                              │
│ Ordine: 7743 - ARREDO NORBA                 │
│ Fase: Punzonatura Euromac                   │
│ Operatore: Mario Rossi                      │
│                                              │
│ Tipo problema:                              │
│ ○ Materiale difettoso                       │
│ ○ Misure non corrispondenti                 │
│ ○ Macchinario guasto                        │
│ ○ Manca materiale                           │
│ ○ Altro                                     │
│                                              │
│ 📝 Descrizione:                             │
│ [______________________________________]     │
│ [______________________________________]     │
│                                              │
│ 📷 Foto (consigliato):                      │
│  [+ SCATTA FOTO]                            │
│                                              │
│ 🚨 Gravità:                                 │
│ ○ Bassa - Proseguo comunque                 │
│ ○ Media - Serve intervento                  │
│ ○ Alta - BLOCCANTE (stop)                   │
│                                              │
│  [INVIA SEGNALAZIONE]  [ANNULLA]            │
│                                              │
└─────────────────────────────────────────────┘
```

**Dopo invio:**
- 🚨 Alert immediato ufficio (se bloccante)
- 🔴 Badge problema su ordine
- 📋 Problema visibile in lista
- 📝 Log attività

### 2.7.6 Registrare Arrivo Materiale

```
┌─────────────────────────────────────────────┐
│ 📦 REGISTRA ARRIVO MATERIALE                │
├─────────────────────────────────────────────┤
│                                              │
│ Ordine: 7743 - ARREDO NORBA                 │
│                                              │
│ Materiali in attesa:                        │
│                                              │
│ ☐ Pannello Alluminio                        │
│    Previsto: 22/03/2026                     │
│                                              │
│ ☐ Vetro sopraluce 1075x665                  │
│    Previsto: 02/03/2026                     │
│                                              │
│ ☐ Maniglione Hoppe E5726                    │
│    Previsto: 02/03/2026                     │
│                                              │
│ Seleziona arrivato:                         │
│ ☑ Vetro sopraluce 1075x665                  │
│                                              │
│ 📅 Data arrivo: 13/02/2026 (oggi) ✓         │
│                                              │
│ 📝 Note (opzionale):                        │
│ [Es: "Arrivato in anticipo, tutto OK"]      │
│ [______________________________________]     │
│                                              │
│ Registrato da: Mario Rossi                  │
│                                              │
│  [REGISTRA ARRIVO]  [ANNULLA]               │
│                                              │
└─────────────────────────────────────────────┘
```

**Dopo registrazione:**
- ✅ Materiale segnato "arrivato"
- 📅 Data arrivo registrata
- 🔔 Notifica ufficio
- 🟢 Update stato ovunque

### 2.7.7 Tab Completati (Storico)

```
┌─────────────────────────────────────────────┐
│ 👤 Mario Rossi - Punzonatura Euromac        │
├─────────────────────────────────────────────┤
│ TAB: [Da fare (4)] [✅ Completati (12)]     │
├─────────────────────────────────────────────┤
│                                              │
│ ✅ COMPLETATI - ULTIMI 7 GIORNI             │
│                                              │
│ 🔍 [Cerca...]  📅 [Filtra data]             │
│                                              │
│ ┌──────────────────────────────────────────┐│
│ │ Conf. 7745 - CLIENTE X                  ││
│ │ ✅ Completato: 13/02/2026 - 09:15       ││
│ │ Punzonatura Euromac - Scocca            ││
│ │                                          ││
│ │       [DETTAGLI]                         ││
│ └──────────────────────────────────────────┘│
│                                              │
│ ┌──────────────────────────────────────────┐│
│ │ Conf. 7741 - CLIENTE Y                  ││
│ │ ✅ Completato: 12/02/2026 - 16:45       ││
│ │ Punzonatura Euromac - Scocca            ││
│ │ 💬 Con note                             ││
│ │                                          ││
│ │       [DETTAGLI]                         ││
│ └──────────────────────────────────────────┘│
│                                              │
└─────────────────────────────────────────────┘
```

---

## 2.8 Alert e Notifiche

### 2.8.1 Alert Giornaliero Ufficio

**Trigger:** Login ufficio ogni mattina (o refresh dashboard)

**Logic:**
```javascript
async function generaAlertGiornaliero() {
  const alert = {
    materialiDaOrdinare: [],
    problemiAperti: [],
    materialiInArrivo: [],
  };
  
  // 1. Materiali NON ordinati
  const ordini = await db.ordini.findMany({
    include: { materiali: true },
    where: { stato: { in: ['in_produzione', 'bloccato'] } }
  });
  
  ordini.forEach(ordine => {
    const nonOrdinati = ordine.materiali.filter(m => 
      m.necessario && !m.ordine_effettuato
    );
    
    if (nonOrdinati.length > 0) {
      alert.materialiDaOrdinare.push({
        ordine_id: ordine.id,
        numero_conferma: ordine.numero_conferma,
        cliente: ordine.cliente,
        materiali: nonOrdinati,
      });
    }
  });
  
  // 2. Problemi aperti
  const problemi = await db.problemi.findMany({
    where: { risolto: false },
    include: { ordine: true, segnalato_da: true },
    orderBy: [
      { gravita: 'desc' }, // bloccanti prima
      { data_segnalazione: 'desc' }
    ]
  });
  alert.problemiAperti = problemi;
  
  // 3. Materiali in arrivo oggi/domani
  const oggi = new Date();
  const domani = addDays(oggi, 1);
  
  ordini.forEach(ordine => {
    const inArrivo = ordine.materiali.filter(m =>
      m.ordine_effettuato && 
      !m.arrivato &&
      m.data_consegna_prevista <= domani
    );
    
    if (inArrivo.length > 0) {
      alert.materialiInArrivo.push({
        ordine_id: ordine.id,
        numero_conferma: ordine.numero_conferma,
        cliente: ordine.cliente,
        materiali: inArrivo,
      });
    }
  });
  
  return alert;
}
```

### 2.8.2 Notifiche Real-Time

**WebSocket events (Server → Client):**

**1. Problema segnalato:**
```javascript
// Server
socket.to('ufficio').emit('problema_segnalato', {
  problema_id: 45,
  ordine_id: 7750,
  numero_conferma: '7750',
  cliente: 'SOLIN SRL',
  fase: 'Piegatura',
  gravita: 'alta_bloccante',
  segnalato_da: 'Giuseppe Verdi',
  descrizione: 'Lamiera con bolla...',
  timestamp: '2026-02-13T11:20:00Z',
});

// Client ufficio
socket.on('problema_segnalato', (data) => {
  // Se bloccante → popup immediato
  if (data.gravita === 'alta_bloccante') {
    mostraPopupUrgente(data);
    riproduciSuono();
  }
  
  // Aggiungi a notifiche
  aggiungiNotifica({
    tipo: 'problema',
    priorita: data.gravita === 'alta_bloccante' ? 'alta' : 'media',
    messaggio: `Problema ${data.gravita} - Ord. ${data.numero_conferma}`,
    data: data,
  });
  
  // Update badge
  aggiornaBadgeNotifiche();
});
```

**2. Materiale arrivato:**
```javascript
socket.to('ufficio').emit('materiale_arrivato', {
  ordine_id: 7743,
  numero_conferma: '7743',
  cliente: 'ARREDO NORBA',
  materiale_tipo: 'Vetro sopraluce',
  materiale_note: '1075x665',
  registrato_da: 'Mario Rossi',
  timestamp: '2026-02-13T14:30:00Z',
});
```

**3. Fase completata:**
```javascript
socket.to('ufficio').emit('fase_completata', {
  ordine_id: 7746,
  numero_conferma: '7746',
  cliente: 'LUDOVICO',
  fase: 'Saldatura',
  operatore: 'Giuseppe Verdi',
  timestamp: '2026-02-13T15:45:00Z',
});
```

**4. Problema risolto:**
```javascript
socket.to(operatore_id).emit('problema_risolto', {
  problema_id: 45,
  ordine_id: 7750,
  risolto_da: 'Mario Rossi (Ufficio)',
  descrizione_risoluzione: 'Sostituita lamiera...',
  timestamp: '2026-02-13T14:30:00Z',
});
```

### 2.8.3 Notifiche Browser (PWA)

**Permission request:**
```javascript
// All'installazione PWA o primo accesso
if ('Notification' in window) {
  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      localStorage.setItem('notifications_enabled', 'true');
    }
  });
}
```

**Mostra notifica:**
```javascript
function mostraNotificaBrowser(titolo, messaggio, tag) {
  if (Notification.permission === 'granted') {
    new Notification(titolo, {
      body: messaggio,
      icon: '/logo-192.png',
      tag: tag, // evita duplicati
      requireInteraction: tag.includes('bloccante'), // resta finché non chiusa
    });
  }
}

// Esempio uso
socket.on('problema_segnalato', (data) => {
  if (data.gravita === 'alta_bloccante') {
    mostraNotificaBrowser(
      '🔴 Problema BLOCCANTE',
      `Ord. ${data.numero_conferma} - ${data.fase}`,
      `problema-${data.problema_id}`
    );
  }
});
```

### 2.8.4 Job Schedulati (Cron)

**Backend - node-cron:**

```javascript
import cron from 'node-cron';

// Ogni giorno alle 08:00
cron.schedule('0 8 * * *', async () => {
  console.log('🕐 Job giornaliero - Alert materiali');
  
  // Già gestito via alert apertura app
  // Ma potremmo inviare email riepilogo
  await inviaEmailRiepilogoGiornaliero();
});

// Ogni giorno alle 08:00
cron.schedule('0 8 * * *', async () => {
  console.log('💾 Job giornaliero - Backup database');
  await backupDatabase();
});

// Ogni ora
cron.schedule('0 * * * *', async () => {
  console.log('⚠️ Check problemi bloccanti aperti >24h');
  
  const problemi = await db.problemi.findMany({
    where: {
      risolto: false,
      gravita: 'alta_bloccante',
      data_segnalazione: {
        lt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    },
    include: { ordine: true }
  });
  
  if (problemi.length > 0) {
    // Invia email alert a ufficio
    await inviaEmailProblemiNonRisolti(problemi);
  }
});
```

---

**[FINE PARTE 2 - Specifiche Funzionali Dettagliate]**

**[CONTINUA con PARTE 3: Architettura Tecnica...]**

Continuo con la Parte 3? 👍
