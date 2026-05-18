-- ============================================================
-- DGS STRATEGY — Schema Database Supabase
-- Esegui questo script nell'SQL Editor di Supabase
-- ============================================================

-- Abilita UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELLA: studi
-- Ogni studio legale ha il proprio spazio isolato
-- ============================================================
CREATE TABLE studi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  piano TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELLA: profili
-- Ogni utente (operatore) appartiene a uno studio
-- ============================================================
CREATE TABLE profili (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  studio_id UUID REFERENCES studi(id) ON DELETE CASCADE,
  ruolo TEXT DEFAULT 'operatore', -- 'admin' | 'operatore'
  nome_completo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- TABELLA: clienti
-- Anagrafica clienti, isolata per studio
-- ============================================================
CREATE TABLE clienti (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID REFERENCES studi(id) ON DELETE CASCADE NOT NULL,
  -- Dati anagrafici
  cognome TEXT NOT NULL,
  nome TEXT NOT NULL,
  sesso TEXT DEFAULT 'M',
  codice_fiscale TEXT,
  data_nascita DATE,
  luogo_nascita TEXT,
  provincia_nascita TEXT,
  -- Residenza
  indirizzo_residenza TEXT,
  comune_residenza TEXT,
  provincia_residenza TEXT,
  cap_residenza TEXT,
  regione_residenza TEXT,
  -- Recapiti
  telefono TEXT,
  cellulare TEXT,
  email TEXT,
  -- Altro
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELLA: pratiche
-- Pratiche ATP collegate a clienti
-- ============================================================
CREATE TABLE pratiche (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID REFERENCES studi(id) ON DELETE CASCADE NOT NULL,
  cliente_id UUID REFERENCES clienti(id) ON DELETE CASCADE NOT NULL,
  -- Tipo pratica
  tipo_prestazione TEXT NOT NULL, -- accompagnamento | pensione100 | assegno_invalidita | frequenza
  stato TEXT DEFAULT 'nuova', -- nuova | in_corso | sospesa | conclusa
  -- Dati INPS
  sede_inps TEXT,
  sede_inps_indirizzo TEXT,
  -- Dati processuali
  tribunale TEXT,
  numero_rg TEXT,
  data_deposito DATE,
  data_udienza DATE,
  -- CTU
  ctu_nome TEXT,
  ctu_cognome TEXT,
  -- Esito
  esito TEXT, -- accolta | rigettata | transatta | rinunciata
  percentuale_invalidita TEXT,
  -- Allegati (quali sono presenti)
  allegati JSONB DEFAULT '{}',
  -- Note
  note_pratica TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELLA: sedi_inps
-- Database sedi INPS per il riconoscimento automatico
-- ============================================================
CREATE TABLE sedi_inps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  denominazione TEXT NOT NULL,
  indirizzo TEXT,
  comune TEXT,
  provincia TEXT,
  cap TEXT,
  codice_sede TEXT,
  telefono TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELLA: template_atti
-- Template Word caricati dallo studio
-- ============================================================
CREATE TABLE template_atti (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID REFERENCES studi(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  tipo_prestazione TEXT, -- a quale prestazione si applica
  file_path TEXT, -- path nel bucket Supabase Storage
  segnaposti JSONB DEFAULT '[]', -- lista dei {{SEGNAPOSTO}} nel template
  attivo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY — Ogni studio vede solo i propri dati
-- ============================================================

ALTER TABLE studi ENABLE ROW LEVEL SECURITY;
ALTER TABLE profili ENABLE ROW LEVEL SECURITY;
ALTER TABLE clienti ENABLE ROW LEVEL SECURITY;
ALTER TABLE pratiche ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_atti ENABLE ROW LEVEL SECURITY;
ALTER TABLE sedi_inps ENABLE ROW LEVEL SECURITY;

-- Policy: ogni utente vede solo il proprio studio
CREATE POLICY "studio_owner" ON studi
  FOR ALL USING (owner_id = auth.uid());

-- Policy: ogni utente vede solo il proprio profilo
CREATE POLICY "profilo_personale" ON profili
  FOR ALL USING (user_id = auth.uid());

-- Policy: ogni utente vede i clienti del proprio studio
CREATE POLICY "clienti_studio" ON clienti
  FOR ALL USING (
    studio_id IN (
      SELECT studio_id FROM profili WHERE user_id = auth.uid()
    )
  );

-- Policy: ogni utente vede le pratiche del proprio studio
CREATE POLICY "pratiche_studio" ON pratiche
  FOR ALL USING (
    studio_id IN (
      SELECT studio_id FROM profili WHERE user_id = auth.uid()
    )
  );

-- Policy: ogni utente vede i template del proprio studio
CREATE POLICY "template_studio" ON template_atti
  FOR ALL USING (
    studio_id IN (
      SELECT studio_id FROM profili WHERE user_id = auth.uid()
    )
  );

-- Policy: sedi INPS sono pubbliche in lettura
CREATE POLICY "sedi_inps_pubblica" ON sedi_inps
  FOR SELECT USING (TRUE);

-- ============================================================
-- STORAGE BUCKET per i file (template Word, allegati)
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('template-atti', 'template-atti', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('allegati-pratiche', 'allegati-pratiche', false);

-- Policy storage
CREATE POLICY "template_upload" ON storage.objects
  FOR ALL USING (bucket_id = 'template-atti' AND auth.role() = 'authenticated');

CREATE POLICY "allegati_upload" ON storage.objects
  FOR ALL USING (bucket_id = 'allegati-pratiche' AND auth.role() = 'authenticated');

-- ============================================================
-- DATI INIZIALI: alcune sedi INPS di esempio
-- (poi da completare con il dataset completo)
-- ============================================================
INSERT INTO sedi_inps (denominazione, comune, provincia, cap, indirizzo) VALUES
('INPS Sede di Napoli', 'Napoli', 'NA', '80133', 'Via Shelley, 1'),
('INPS Sede di Roma', 'Roma', 'RM', '00187', 'Via Ciro il Grande, 21'),
('INPS Sede di Milano', 'Milano', 'MI', '20124', 'Via Molino delle Armi, 5'),
('INPS Sede di Torino', 'Torino', 'TO', '10124', 'Corso Re Umberto, 10'),
('INPS Sede di Palermo', 'Palermo', 'PA', '90143', 'Via Imperatore Federico, 74'),
('INPS Sede di Bari', 'Bari', 'BA', '70126', 'Via Calefati, 161'),
('INPS Sede di Firenze', 'Firenze', 'FI', '50129', 'Viale Milton, 65'),
('INPS Sede di Bologna', 'Bologna', 'BO', '40139', 'Via Gramsci, 6'),
('INPS Sede di Catania', 'Catania', 'CT', '95124', 'Via Etnea, 201'),
('INPS Sede di Venezia', 'Venezia', 'VE', '30175', 'Via Ca'' Marcello, 67/B');

-- ============================================================
-- TRIGGER: aggiorna updated_at automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clienti_updated BEFORE UPDATE ON clienti FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER pratiche_updated BEFORE UPDATE ON pratiche FOR EACH ROW EXECUTE FUNCTION update_updated_at();
