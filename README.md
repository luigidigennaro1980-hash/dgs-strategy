# DGS Strategy — Gestionale Studio Legale

Piattaforma web per la gestione delle pratiche ATP e clienti degli studi legali.

## Stack tecnologico
- **Frontend**: Next.js 14 + React + TypeScript
- **Stile**: Tailwind CSS
- **Database + Auth**: Supabase
- **Deploy**: Vercel
- **Generazione atti**: libreria `docx`

---

## GUIDA ALL'INSTALLAZIONE COMPLETA

### STEP 1 — Configura il database su Supabase

1. Vai su https://supabase.com e accedi al tuo progetto
2. Nel menu a sinistra clicca su **SQL Editor**
3. Crea una nuova query (pulsante **"New query"**)
4. Apri il file `database/schema.sql` da questo progetto
5. Copia tutto il contenuto e incollalo nell'editor SQL
6. Clicca **"Run"** per eseguire
7. Verifica che non ci siano errori

### STEP 2 — Carica il codice su GitHub

1. Vai su https://github.com e accedi come `luigidigennaro1980-hash`
2. Clicca **"New repository"** (bottone verde in alto a destra)
3. Nome repository: `dgs-strategy`
4. Lascia tutto il resto invariato, clicca **"Create repository"**
5. GitHub ti mostrerà una pagina con istruzioni — copia l'URL del repository (finisce con `.git`)

### STEP 3 — Carica i file su GitHub

Hai due opzioni:

**Opzione A — Tramite browser (più semplice):**
1. Sul repository appena creato, clicca **"uploading an existing file"**
2. Trascina tutti i file del progetto nella pagina
3. Clicca **"Commit changes"**

**Opzione B — Da terminale (se hai Git installato):**
```bash
cd percorso/dgs-strategy
git init
git add .
git commit -m "primo commit"
git branch -M main
git remote add origin https://github.com/luigidigennaro1980-hash/dgs-strategy.git
git push -u origin main
```

### STEP 4 — Deploy su Vercel

1. Vai su https://vercel.com e accedi
2. Clicca **"Add New Project"**
3. Seleziona **"Import Git Repository"**
4. Connetti il tuo account GitHub se richiesto
5. Seleziona il repository `dgs-strategy`
6. Nella sezione **"Environment Variables"** aggiungi:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://xwrwrdizvdfakblnahag.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = la tua chiave anon/public
7. Clicca **"Deploy"**
8. Aspetta 2-3 minuti — il sito sarà online!

### STEP 5 — Acquista il dominio (opzionale ma consigliato)

1. Vai su https://www.aruba.it
2. Cerca `dgs-strategy.it` o il nome che preferisci
3. Acquista il dominio (~10-15€/anno)
4. Su Vercel vai in **Settings → Domains** e aggiungi il dominio acquistato

---

## Struttura del progetto

```
dgs-strategy/
├── src/
│   ├── app/                    # Pagine dell'applicazione
│   │   ├── login/              # Pagina login/registrazione
│   │   ├── dashboard/          # Dashboard principale
│   │   ├── clienti/            # Gestione clienti
│   │   │   ├── page.tsx        # Lista clienti
│   │   │   ├── nuovo/          # Nuovo cliente
│   │   │   └── [id]/           # Dettaglio cliente (da sviluppare)
│   │   └── pratiche/           # Gestione pratiche ATP
│   │       ├── page.tsx        # Lista pratiche
│   │       ├── nuova/          # Nuova pratica
│   │       └── [id]/           # Dettaglio pratica (da sviluppare)
│   ├── components/
│   │   └── layout/             # Componenti layout (sidebar, header)
│   ├── lib/
│   │   └── supabase.ts         # Client Supabase
│   └── styles/
│       └── globals.css         # Stili globali
└── database/
    └── schema.sql              # Schema del database
```

---

## Funzionalità implementate

- [x] Login e registrazione multi-studio
- [x] Dashboard con statistiche
- [x] Lista e ricerca clienti
- [x] Anagrafica completa cliente
- [x] Lista e filtro pratiche ATP
- [x] Nuova pratica ATP con tutti i campi
- [x] Selezione automatica allegati per tipo prestazione
- [x] Database sedi INPS

## Prossimi sviluppi

- [ ] Dettaglio cliente con storico pratiche
- [ ] Dettaglio pratica con generazione atto Word
- [ ] Caricamento template Word personalizzati
- [ ] Generazione automatica ricorso ATP
- [ ] Gestione utenti/operatori dello studio
- [ ] Dataset completo sedi INPS
