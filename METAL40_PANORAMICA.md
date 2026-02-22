# 📘 METAL 4.0 - PANORAMICA E REQUISITI

## PANORAMICA PROGETTO

**Cliente:** Metal 4.0 S.r.l.s.  
**Settore:** Produzione porte blindate su misura  
**Dipendenti:** 10  
**Problema:** Tracciamento produzione su fogli cartacei  

---

## OBIETTIVO

Digitalizzare il processo produttivo con una web app che permetta di:
- ✅ Tracciare stato avanzamento porte in tempo reale
- ✅ Gestire ordini materiali ai fornitori
- ✅ Alert automatici materiali non ordinati
- ✅ Segnalare e risolvere problemi in produzione
- ✅ Visibilità completa dall'ufficio

---

## UTENTI

### UFFICIO (2-3 persone)
**Dispositivo:** PC Desktop  
**Funzioni:**
- Crea ordini (upload PDF + AI estrazione)
- Gestisce materiali (ordina, traccia arrivi)
- Monitor produzione (dashboard real-time)
- Risolve problemi

### OPERATORI (7-8 persone)
**Dispositivo:** Tablet Android (7 tablet - uno per reparto)  
**Funzioni:**
- Completa fasi produzione (firma digitale)
- Segnala problemi (con foto)
- Aggiunge note
- Registra arrivi materiali

### REPARTI PRODUZIONE
1. Punzonatura Dalcos (telaio/falsotelaio)
2. Punzonatura Euromac (scocca)
3. Piegatura
4. Saldatura/Assemblaggio
5. Rivestimento
6. Imballaggio
7. Magazzino/Ricezione

---

## WORKFLOW PRODUZIONE

### TIPOLOGIE TELAIO

**A) Standard con falsotelaio** (più comune)
```
Falsotelaio: Punzonatura Dalcos → Piegatura → Assemblaggio
Telaio: Punzonatura Dalcos → Piegatura → Assemblaggio
[Se colore fuori standard] → Verniciatura esterna
```

**B) Ristrutturazione L/Z** (senza falsotelaio)
```
Barre già piegate in magazzino
Taglio → Assemblaggio
[Se colore fuori standard] → Verniciatura
```

**C) Su falsotelaio non nostro**
```
Solo telaio: Punzonatura Dalcos → Piegatura → Assemblaggio
[Se colore fuori standard] → Verniciatura
```

### WORKFLOW SCOCCA
```
1. Punzonatura Euromac (lamiera)
2. Piegatura accessori
3. Saldatura/Assemblaggio
4. Rivestimento interno (pannello)
5. Rivestimento esterno (pannello)
```

### ASSEMBLAGGIO FINALE
```
6. Prova in telaio e imballaggio
7. Riconsegna foglio ufficio (pronta spedizione)
```

**REGOLE:**
- Telaio e scocca in parallelo
- Scocca inizia quando: pannello arrivato OR manca ≤7 giorni
- Verniciatura: Marrone/Bianco = NO, altri colori = SÌ

---

## SISTEMA MATERIALI (9 TIPOLOGIE)

| Materiale | Tempi | Note |
|-----------|-------|------|
| Pannello Okoumè/MDF | +30gg | Opzionale |
| Pannello PVC | +40gg | Opzionale |
| Pannello Alluminio | +40gg | Opzionale |
| Mostrine Okoumè/MDF | +30gg | Opzionale |
| Kit imbotte | +20gg | Opzionale |
| Vetro | +20gg | Opzionale |
| Maniglione | +20gg | Opzionale |

**A MAGAZZINO (non tracciare):**
- Pannelli laminato
- Mostrine laminato
- Accessori standard

**STATI MATERIALE:**
- 🔴 NON ORDINATO → Alert ufficio
- 🟡 ORDINATO → Tracking consegna
- 🟢 ARRIVATO → Produzione procede

**ALERT GIORNALIERO:**
Popup all'apertura app ufficio con:
- Materiali da ordinare (per ordine)
- Problemi aperti (bloccanti first)
- Materiali in arrivo oggi/domani

---

## GESTIONE PROBLEMI

**3 LIVELLI GRAVITÀ:**
- 🟢 BASSA - Proseguo comunque
- 🟡 MEDIA - Serve intervento
- 🔴 ALTA BLOCCANTE - Ferma produzione

**WORKFLOW:**
```
Operatore segnala (con foto)
    ↓
Alert immediato ufficio (se bloccante)
    ↓
Ufficio o operatore risolve
    ↓
Sistema traccia tutto (tempo, autori, foto)
```

**CHI RISOLVE:**
- Ufficio (sempre)
- Operatore che ha segnalato

---

## INTERFACCE

### DASHBOARD UFFICIO (Desktop)

**KPI Row:**
- Porte in produzione
- Urgenti
- Problemi aperti
- Pronte spedizione

**Lista Ordini:**
- Numero conferma
- Cliente
- Stato produzione (fase attuale)
- Materiali (🔴 da ordinare, 🟡 in attesa, ✅ ok)
- Giorni in produzione
- Azioni: [APRI] [EDIT]

**Dettaglio Ordine:**
- Info complete
- Timeline fasi (✅ completate, 🔴 da fare)
- Materiali con stato
- Problemi segnalati
- Note e comunicazioni

**Tab Dedicati:**
- Dashboard principale
- Problemi (aperti/risolti)
- Materiali (da ordinare/in attesa)
- Report (tempi, statistiche)

### DASHBOARD OPERATORE (Tablet)

**Lista Fasi Da Fare:**
- Solo PROSSIME fasi di competenza
- Urgenti evidenziati
- Stato materiali visibile
- Ordinamento: urgenti → materiali ok → cronologico

**Dettaglio Ordine:**
- PDF foglio produzione
- Stato materiali
- Note ordine
- Azioni:
  - ✅ Completa fase
  - ⚠️ Segnala problema
  - 📝 Aggiungi nota
  - 📷 Scatta foto
  - 📦 Registra arrivo materiale

**Tab Completati:**
- Storico fasi firmate
- Ultimi 7 giorni
- Ricerca per data/ordine

---

## CREAZIONE ORDINE CON AI

**WORKFLOW:**
```
1. Ufficio carica PDF foglio produzione
2. AI Claude estrae automaticamente:
   - Numero conferma
   - Cliente
   - Tipo telaio
   - Colori
   - Pannelli (tipo + colore)
   - Mostrine
   - Kit imbotte
   - Vetri + misure
   - Maniglione
3. Ufficio verifica/corregge
4. Ufficio compila materiali da ordinare
5. Sistema crea ordine + fasi produzione
```

**CALCOLO AUTOMATICO:**
- Date consegna materiali (+20/30/40gg)
- Verniciatura necessaria (colori fuori standard)
- Fasi produzione (in base a tipo telaio)

---

## NOTIFICHE REAL-TIME

**WebSocket Eventi:**
- 🔴 Problema bloccante segnalato
- 📦 Materiale arrivato
- ✅ Fase completata
- ⚠️ Problema risolto

**Browser Notifications:**
- Permission request all'installazione PWA
- Alert sonori per problemi bloccanti
- Badge contatori non letti

---

## PRIORITÀ VISUALIZZAZIONE

**Ufficio - Ordini:**
1. Urgenti (data tassativa)
2. Problemi bloccanti
3. Materiali da ordinare
4. Altri cronologici

**Operatore - Fasi:**
1. Urgenti
2. Materiali tutti disponibili
3. Materiali ≤7 giorni
4. Altri cronologici

---

## NOTE TECNICHE

**PWA (Progressive Web App):**
- Installabile su tablet come app nativa
- Funziona offline (limitato)
- Notifiche push
- Auto-update

**Autenticazione:**
- PIN a 4 cifre (operatori)
- Email + PIN (ufficio)
- JWT token 8 ore
- Logout automatico inattività

**File Storage:**
- PDF fogli produzione
- Foto note/problemi/fasi
- Compressione automatica immagini
- Max 10MB PDF, 5MB foto

---

Per dettagli tecnici completi, vedi:
- ARCHITETTURA.md (database, API, stack)
- SETUP_GUIDE.md (infrastruttura)
- CLAUDE_CODE_INSTRUCTIONS.md (sviluppo)
