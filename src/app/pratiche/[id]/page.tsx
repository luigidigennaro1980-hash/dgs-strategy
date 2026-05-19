'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import AppLayout from '@/components/layout/AppLayout'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileDown, User, Building } from 'lucide-react'

const tipoLabel: Record<string, string> = {
  accompagnamento: 'Indennità di Accompagnamento',
  pensione100: 'Pensione di Inabilità 100%',
  assegno_invalidita: 'Assegno di Invalidità',
  frequenza: 'Indennità di Frequenza',
}

const statoLabel: Record<string, { label: string; cls: string }> = {
  nuova: { label: 'Nuova', cls: 'badge-gray' },
  in_corso: { label: 'In corso', cls: 'badge-blue' },
  sospesa: { label: 'Sospesa', cls: 'badge-amber' },
  conclusa: { label: 'Conclusa', cls: 'badge-green' },
}

const allegatiLabel: Record<string, string> = {
  allto01: 'All. 1 — Certificato medico / domanda',
  allto02: 'All. 2 — Verbale INPS',
  allto03: 'All. 3 — Documentazione medica',
  allto04: 'All. 4 — Atto notorio',
  allto05: 'All. 5 — Collocamento mirato',
  allto06: 'All. 6 — Certificato frequenza',
  allto07: 'All. 7 — Esenzione soccombenza',
  allto08: 'All. 8 — Esenzione contributo unificato',
}

export default function DettaglioPraticaPage() {
  const [pratica, setPratica] = useState<any>(null)
  const [cliente, setCliente] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generando, setGenerando] = useState(false)
  const [errore, setErrore] = useState('')
  const params = useParams()

  useEffect(() => {
    if (!params?.id) return
    const supabase = createClient()
    supabase
      .from('pratiche')
      .select('*, clienti(*)')
      .eq('id', params.id as string)
      .single()
      .then(({ data, error }) => {
        if (error) { setErrore('Pratica non trovata.'); setLoading(false); return }
        if (data) { setPratica(data); setCliente(data.clienti) }
        setLoading(false)
      })
  }, [params?.id])

  const generaRicorso = async () => {
    if (!pratica || !cliente) return
    setGenerando(true)
    setErrore('')
    try {
      const importoMensile = 531.76
      const importoAnnuo = (importoMensile * 12).toFixed(2)
      const importoDecennale = (importoMensile * 12 * 10).toFixed(2)

      const response = await fetch('/template_accompagnamento.docx')
      if (!response.ok) throw new Error('Template non trovato')
      const arrayBuffer = await response.arrayBuffer()

      const PizZip = (await import('pizzip')).default
      const Docxtemplater = (await import('docxtemplater')).default

      const zip = new PizZip(arrayBuffer)
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: '{{', end: '}}' }
      })

      const dataNascita = cliente.data_nascita
        ? new Date(cliente.data_nascita).toLocaleDateString('it-IT') : ''

      doc.render({
        COGNOME: cliente.cognome || '',
        NOME: cliente.nome || '',
        CODICE_FISCALE: cliente.codice_fiscale || '',
        DATA_NASCITA: dataNascita,
        LUOGO_NASCITA: cliente.luogo_nascita || '',
        COMUNE: cliente.comune_residenza || '',
        INDIRIZZO: cliente.indirizzo_residenza || '',
        CAP: cliente.cap_residenza || '',
        SEDE_INPS_LOCALE: pratica.sede_inps || '',
        SEDE_INPS_INDIRIZZO: pratica.sede_inps_indirizzo || '',
        SEDE_INPS_PEC: pratica.sede_inps_pec || '',
        CITTA_TRIBUNALE: (pratica.tribunale || '').replace('Tribunale di ', '').replace('Tribunale Civile di ', ''),
        DATA_DOMANDA: pratica.data_deposito ? new Date(pratica.data_deposito).toLocaleDateString('it-IT') : '',
        NUMERO_DOMUS: pratica.numero_domus || '',
        DATA_VISITA: pratica.data_visita ? new Date(pratica.data_visita).toLocaleDateString('it-IT') : '',
        DIAGNOSI_VERBALE: pratica.diagnosi_verbale || '',
        IMPORTO_MENSILE: importoMensile.toFixed(2).replace('.', ','),
        IMPORTO_ANNUO: importoAnnuo.replace('.', ','),
        IMPORTO_DECENNALE: importoDecennale.replace('.', ','),
        CITTA_STUDIO: 'Roma',
        DATA_RICORSO: new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }),
      })

      const blob = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Ricorso_ATP_${cliente.cognome}_${cliente.nome}.docx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setErrore('Errore nella generazione: ' + (err.message || 'errore sconosciuto'))
      console.error(err)
    }
    setGenerando(false)
  }

  const Field = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontFamily: mono ? 'monospace' : undefined }}>{value || '—'}</div>
    </div>
  )

  if (loading) return (
    <AppLayout>
      <div style={{ padding: '2rem', color: '#64748b' }}>Caricamento...</div>
    </AppLayout>
  )

  if (errore && !pratica) return (
    <AppLayout>
      <div style={{ padding: '2rem', color: 'var(--color-danger)' }}>{errore}</div>
    </AppLayout>
  )

  const allegatiPresenti = Object.entries(pratica?.allegati || {}).filter(([, v]) => v)
  const card = { background: 'white', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.5rem', marginBottom: '1.25rem' }
  const cardTitle = { fontSize: 14, fontWeight: 600, color: 'var(--color-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }
  const grid3 = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }

  return (
    <AppLayout>
      <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: '1.5rem' }}>
          <Link href="/pratiche" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', textDecoration: 'none', fontSize: 14 }}>
            <ArrowLeft size={16} /> Pratiche
          </Link>
          <span style={{ color: '#e2e8f0' }}>/</span>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{cliente?.cognome} {cliente?.nome}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>{tipoLabel[pratica?.tipo_prestazione] || pratica?.tipo_prestazione}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className={`badge ${statoLabel[pratica?.stato]?.cls || 'badge-gray'}`}>{statoLabel[pratica?.stato]?.label || pratica?.stato}</span>
              {pratica?.numero_rg && <span style={{ fontSize: 13, color: '#64748b' }}>RG {pratica.numero_rg}</span>}
            </div>
          </div>
          <button onClick={generaRicorso} disabled={generando} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 8, background: 'var(--color-primary)', color: 'white', border: 'none', cursor: generando ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 500, opacity: generando ? 0.7 : 1 }}>
            <FileDown size={16} />
            {generando ? 'Generazione...' : 'Genera Ricorso ATP'}
          </button>
        </div>

        {errore && <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13, marginBottom: '1rem' }}>{errore}</div>}

        <div style={card}>
          <div style={cardTitle}><User size={16} /> Ricorrente</div>
          <div style={grid3}>
            <Field label="Cognome e Nome" value={`${cliente?.cognome} ${cliente?.nome}`} />
            <Field label="Codice Fiscale" value={cliente?.codice_fiscale} mono />
            <Field label="Data di nascita" value={cliente?.data_nascita ? new Date(cliente.data_nascita).toLocaleDateString('it-IT') : ''} />
            <Field label="Luogo di nascita" value={cliente?.luogo_nascita} />
            <Field label="Comune residenza" value={cliente?.comune_residenza} />
            <Field label="CAP" value={cliente?.cap_residenza} />
            <Field label="Indirizzo" value={cliente?.indirizzo_residenza} />
            <Field label="Telefono" value={cliente?.telefono || cliente?.cellulare} />
          </div>
        </div>

        <div style={card}>
          <div style={cardTitle}><Building size={16} /> Dati Processuali</div>
          <div style={grid3}>
            <Field label="Sede INPS" value={pratica?.sede_inps} />
            <Field label="Indirizzo INPS" value={pratica?.sede_inps_indirizzo} />
            <Field label="PEC INPS" value={pratica?.sede_inps_pec} />
            <Field label="Data domanda" value={pratica?.data_deposito ? new Date(pratica.data_deposito).toLocaleDateString('it-IT') : ''} />
            <Field label="Numero Domus" value={pratica?.numero_domus} />
            <Field label="Data visita" value={pratica?.data_visita ? new Date(pratica.data_visita).toLocaleDateString('it-IT') : ''} />
            <Field label="Tribunale" value={pratica?.tribunale} />
            <Field label="Numero RG" value={pratica?.numero_rg} />
            <Field label="Data udienza" value={pratica?.data_udienza ? new Date(pratica.data_udienza).toLocaleDateString('it-IT') : ''} />
            <Field label="CTU" value={pratica?.ctu_cognome ? `${pratica.ctu_cognome} ${pratica.ctu_nome}` : ''} />
            <Field label="Esito" value={pratica?.esito} />
            <Field label="Invalidità" value={pratica?.percentuale_invalidita} />
          </div>
          {pratica?.diagnosi_verbale && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Diagnosi verbale INPS</div>
              <div style={{ fontSize: 14 }}>{pratica.diagnosi_verbale}</div>
            </div>
          )}
          {pratica?.note_pratica && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Note</div>
              <div style={{ fontSize: 14 }}>{pratica.note_pratica}</div>
            </div>
          )}
        </div>

        {allegatiPresenti.length > 0 && (
          <div style={card}>
            <div style={cardTitle}>Allegati previsti</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {allegatiPresenti.map(([k]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 13 }}>
                  <span style={{ color: '#16a34a', fontWeight: 600 }}>✓</span>
                  {allegatiLabel[k] || k}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

