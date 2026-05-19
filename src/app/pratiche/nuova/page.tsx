'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import AppLayout from '@/components/layout/AppLayout'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, FolderOpen, Search } from 'lucide-react'
import Link from 'next/link'

const TIPI_PRESTAZIONE = [
  { value: 'accompagnamento', label: 'Indennità di Accompagnamento' },
  { value: 'pensione100', label: 'Pensione di Inabilità 100%' },
  { value: 'assegno_invalidita', label: 'Assegno di Invalidità' },
  { value: 'frequenza', label: 'Indennità di Frequenza' },
]

const allegatiPerTipo: Record<string, string[]> = {
  accompagnamento: ['allto01', 'allto02', 'allto03', 'allto04', 'allto07', 'allto08'],
  pensione100: ['allto01', 'allto02', 'allto03', 'allto04', 'allto05', 'allto07', 'allto08'],
  assegno_invalidita: ['allto01', 'allto02', 'allto03', 'allto04', 'allto05', 'allto07', 'allto08'],
  frequenza: ['allto01', 'allto02', 'allto03', 'allto04', 'allto06', 'allto07', 'allto08'],
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

export default function NuovaPraticaPage() {
  const [clienti, setClienti] = useState<any[]>([])
  const [clientiFiltrati, setClientiFiltrati] = useState<any[]>([])
  const [clienteSelezionato, setClienteSelezionato] = useState<any>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [tipoPrestazione, setTipoPrestazione] = useState('accompagnamento')
  const [allegatiChecked, setAllegatiChecked] = useState<Record<string, boolean>>({})
  const [sediInps, setSediInps] = useState<any[]>([])
  const [sedeInps, setSedeInps] = useState('')
  const [sedeInpsIndirizzo, setSedeInpsIndirizzo] = useState('')
  const [sedeInpsPec, setSedeInpsPec] = useState('')
  const [errore, setErrore] = useState('')
  const studioIdRef = useRef('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profilo } = await supabase.from('profili').select('studio_id').eq('user_id', user.id).single()
      if (!profilo) return
      studioIdRef.current = profilo.studio_id
      const { data: cl } = await supabase.from('clienti').select('id, nome, cognome, codice_fiscale, provincia_residenza, comune_residenza').eq('studio_id', profilo.studio_id).order('cognome')
      setClienti(cl || [])
      setClientiFiltrati(cl || [])
      const { data: sedi } = await supabase.from('sedi_inps').select('*').order('denominazione')
      setSediInps(sedi || [])
    }
    init()
  }, [])

  const cercaSedePerProvincia = (provincia: string) => {
    if (!provincia || sediInps.length === 0) return
    const sede = sediInps.find(s => s.provincia === provincia.toUpperCase())
    if (sede) {
      setSedeInps(sede.denominazione)
      setSedeInpsIndirizzo(sede.indirizzo + ', ' + sede.cap + ' ' + sede.comune + ' (' + sede.provincia + ')')
      setSedeInpsPec(sede.pec || '')
    }
  }

  const handleSearchCliente = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase()
    setClientiFiltrati(clienti.filter(c => `${c.cognome} ${c.nome} ${c.codice_fiscale}`.toLowerCase().includes(val)))
    setShowDropdown(true)
  }

  const selezionaCliente = (c: any) => {
    setClienteSelezionato(c)
    setShowDropdown(false)
    const input = document.getElementById('search-cliente') as HTMLInputElement
    if (input) input.value = `${c.cognome} ${c.nome}`
    if (c.provincia_residenza) cercaSedePerProvincia(c.provincia_residenza)
  }

  const toggleAllegato = (k: string) => {
    setAllegatiChecked(prev => ({ ...prev, [k]: !prev[k] }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!clienteSelezionato) { setErrore('Seleziona un cliente.'); return }
    setErrore('')

    const form = e.currentTarget
    const get = (name: string) => (form.elements.namedItem(name) as HTMLInputElement)?.value || ''

    const { data, error } = await supabase.from('pratiche').insert({
      studio_id: studioIdRef.current,
      cliente_id: clienteSelezionato.id,
      tipo_prestazione: tipoPrestazione,
      stato: get('stato'),
      sede_inps: sedeInps,
      sede_inps_indirizzo: sedeInpsIndirizzo,
      sede_inps_pec: sedeInpsPec,
      tribunale: get('tribunale'),
      numero_rg: get('numero_rg'),
      data_deposito: get('data_deposito') || null,
      data_udienza: get('data_udienza') || null,
      numero_domus: get('numero_domus'),
      data_visita: get('data_visita') || null,
      diagnosi_verbale: get('diagnosi_verbale'),
      ctu_nome: get('ctu_nome'),
      ctu_cognome: get('ctu_cognome'),
      esito: get('esito') || null,
      percentuale_invalidita: get('percentuale_invalidita'),
      note_pratica: get('note_pratica'),
      allegati: allegatiChecked,
    }).select().single()

    if (error) { setErrore('Errore: ' + error.message); return }
    router.push(`/pratiche/${data.id}`)
  }

  const s = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }
  const sectionStyle = { background: 'white', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.5rem', marginBottom: '1.25rem' }
  const titleStyle = { fontSize: 14, fontWeight: 600, color: 'var(--color-primary)', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }
  const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }
  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 4 }

  return (
    <AppLayout>
      <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: '1.5rem' }}>
          <Link href="/pratiche" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: 14 }}>
            <ArrowLeft size={16} /> Pratiche
          </Link>
          <span style={{ color: 'var(--color-border)' }}>/</span>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Nuova pratica ATP</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FolderOpen size={20} color="white" />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Nuova Pratica ATP</h1>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Cliente */}
          <div style={sectionStyle}>
            <div style={titleStyle}>Cliente</div>
            <label style={labelStyle}>Ricorrente *</label>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
              <input id="search-cliente" style={{ ...s, paddingLeft: 36 }} placeholder="Cerca per nome o codice fiscale..." onChange={handleSearchCliente} onFocus={() => setShowDropdown(true)} autoComplete="off" />
              {showDropdown && clientiFiltrati.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: 'white', border: '1px solid var(--color-border)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: 200, overflowY: 'auto', marginTop: 4 }}>
                  {clientiFiltrati.slice(0, 8).map(c => (
                    <div key={c.id} onMouseDown={() => selezionaCliente(c)} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: 14 }}>
                      <strong>{c.cognome} {c.nome}</strong>
                      <span style={{ color: '#64748b', marginLeft: 8, fontSize: 12, fontFamily: 'monospace' }}>{c.codice_fiscale}</span>
                      {c.comune_residenza && <span style={{ color: '#64748b', marginLeft: 8, fontSize: 12 }}>— {c.comune_residenza} ({c.provincia_residenza})</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {clienteSelezionato && (
              <div style={{ marginTop: 10, padding: '10px 14px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, fontSize: 13 }}>
                ✓ <strong>{clienteSelezionato.cognome} {clienteSelezionato.nome}</strong> — CF: {clienteSelezionato.codice_fiscale} — Prov: {clienteSelezionato.provincia_residenza}
              </div>
            )}
          </div>

          {/* Tipo pratica */}
          <div style={sectionStyle}>
            <div style={titleStyle}>Tipo di Pratica</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Prestazione richiesta *</label>
                <select style={s} value={tipoPrestazione} onChange={e => setTipoPrestazione(e.target.value)}>
                  {TIPI_PRESTAZIONE.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Stato pratica</label>
                <select name="stato" style={s}>
                  <option value="nuova">Nuova</option>
                  <option value="in_corso">In corso</option>
                  <option value="sospesa">Sospesa</option>
                  <option value="conclusa">Conclusa</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dati INPS — compilati automaticamente */}
          <div style={sectionStyle}>
            <div style={titleStyle}>
              Dati INPS
              {sedeInps && <span style={{ fontSize: 11, fontWeight: 400, color: '#16a34a', marginLeft: 8 }}>✓ Rilevata automaticamente dalla provincia del cliente</span>}
            </div>
            <div style={gridStyle}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Sede INPS convenuta</label>
                <input style={s} value={sedeInps} onChange={e => setSedeInps(e.target.value)} placeholder="Compilata automaticamente dalla provincia del cliente" />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Indirizzo sede INPS</label>
                <input style={s} value={sedeInpsIndirizzo} onChange={e => setSedeInpsIndirizzo(e.target.value)} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>PEC sede INPS</label>
                <input style={s} value={sedeInpsPec} onChange={e => setSedeInpsPec(e.target.value)} />
              </div>
              <div><label style={labelStyle}>Data domanda INPS</label><input name="data_deposito" type="date" style={s} /></div>
              <div><label style={labelStyle}>Numero Domus</label><input name="numero_domus" style={s} placeholder="Es. 9153000557739" /></div>
              <div><label style={labelStyle}>Data visita commissione</label><input name="data_visita" type="date" style={s} /></div>
              <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Diagnosi verbale INPS</label><textarea name="diagnosi_verbale" rows={3} style={{ ...s, resize: 'vertical' }} placeholder="Testo della diagnosi come riportato nel verbale INPS" /></div>
            </div>
          </div>

          {/* Dati processuali */}
          <div style={sectionStyle}>
            <div style={titleStyle}>Dati Processuali</div>
            <div style={gridStyle}>
              <div><label style={labelStyle}>Tribunale competente</label><input name="tribunale" style={s} placeholder="Es. Tribunale di Roma" /></div>
              <div><label style={labelStyle}>Numero RG</label><input name="numero_rg" style={s} placeholder="Es. 1234/2024" /></div>
              <div><label style={labelStyle}>Data udienza</label><input name="data_udienza" type="date" style={s} /></div>
              <div><label style={labelStyle}>CTU — Cognome</label><input name="ctu_cognome" style={s} /></div>
              <div><label style={labelStyle}>CTU — Nome</label><input name="ctu_nome" style={s} /></div>
            </div>
          </div>

          {/* Esito */}
          <div style={sectionStyle}>
            <div style={titleStyle}>Esito</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Esito pratica</label>
                <select name="esito" style={s}>
                  <option value="">Nessun esito</option>
                  <option value="accolta">Accolta</option>
                  <option value="rigettata">Rigettata</option>
                  <option value="transatta">Transatta</option>
                  <option value="rinunciata">Rinunciata</option>
                </select>
              </div>
              <div><label style={labelStyle}>Percentuale invalidità</label><input name="percentuale_invalidita" style={s} placeholder="Es. 100%" /></div>
              <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Note</label><textarea name="note_pratica" rows={3} style={{ ...s, resize: 'vertical' }} /></div>
            </div>
          </div>

          {/* Allegati */}
          <div style={sectionStyle}>
            <div style={titleStyle}>Allegati — {TIPI_PRESTAZIONE.find(t => t.value === tipoPrestazione)?.label}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {allegatiPerTipo[tipoPrestazione].map(k => (
                <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: `1px solid ${allegatiChecked[k] ? '#bae6fd' : 'var(--color-border)'}`, borderRadius: 8, cursor: 'pointer', fontSize: 13, background: allegatiChecked[k] ? '#f0f9ff' : 'white' }}>
                  <input type="checkbox" checked={!!allegatiChecked[k]} onChange={() => toggleAllegato(k)} style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }} />
                  {allegatiLabel[k]}
                </label>
              ))}
            </div>
          </div>

          {errore && <p style={{ color: 'var(--color-danger)', fontSize: 14, marginBottom: '1rem' }}>{errore}</p>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Link href="/pratiche" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border)', textDecoration: 'none', fontSize: 14, color: 'var(--color-text)' }}>Annulla</Link>
            <button type="submit" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, background: 'var(--color-primary)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
              <Save size={16} /> Salva pratica
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
