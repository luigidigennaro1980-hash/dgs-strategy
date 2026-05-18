'use client'
import { useState, useEffect } from 'react'
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

const STATI = [
  { value: 'nuova', label: 'Nuova' },
  { value: 'in_corso', label: 'In corso' },
  { value: 'sospesa', label: 'Sospesa' },
  { value: 'conclusa', label: 'Conclusa' },
]

const ESITI = [
  { value: '', label: 'Nessun esito' },
  { value: 'accolta', label: 'Accolta' },
  { value: 'rigettata', label: 'Rigettata' },
  { value: 'transatta', label: 'Transatta' },
  { value: 'rinunciata', label: 'Rinunciata' },
]

export default function NuovaPraticaPage() {
  const [clienti, setClienti] = useState<any[]>([])
  const [searchCliente, setSearchCliente] = useState('')
  const [clienteSelezionato, setClienteSelezionato] = useState<any>(null)
  const [showClientiList, setShowClientiList] = useState(false)
  const [sediINPS, setSediINPS] = useState<any[]>([])
  const [studioId, setStudioId] = useState('')

  const [form, setForm] = useState({
    cliente_id: '',
    tipo_prestazione: 'accompagnamento',
    stato: 'nuova',
    sede_inps: '',
    sede_inps_indirizzo: '',
    tribunale: '',
    numero_rg: '',
    data_deposito: '',
    data_udienza: '',
    ctu_nome: '',
    ctu_cognome: '',
    esito: '',
    percentuale_invalidita: '',
    note_pratica: '',
    allegati: {
      allto01: false, allto02: false, allto03: false, allto04: false,
      allto05: false, allto06: false, allto07: false, allto08: false
    }
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profilo } = await supabase.from('profili').select('studio_id').eq('user_id', user.id).single()
      if (!profilo) return
      setStudioId(profilo.studio_id)

      const { data: cl } = await supabase.from('clienti').select('id, nome, cognome, codice_fiscale, cap_residenza, comune_residenza').eq('studio_id', profilo.studio_id).order('cognome')
      setClienti(cl || [])

      const { data: sedi } = await supabase.from('sedi_inps').select('*').order('comune')
      setSediINPS(sedi || [])
    }
    init()
  }, [])

  const clientiFiltrati = clienti.filter(c =>
    `${c.cognome} ${c.nome} ${c.codice_fiscale}`.toLowerCase().includes(searchCliente.toLowerCase())
  )

  const selezionaCliente = (c: any) => {
    setClienteSelezionato(c)
    setForm(f => ({ ...f, cliente_id: c.id }))
    setShowClientiList(false)
    setSearchCliente(`${c.cognome} ${c.nome}`)

    if (c.cap_residenza && sediINPS.length > 0) {
      const sede = sediINPS.find(s => s.cap === c.cap_residenza || s.provincia === c.cap_residenza?.substring(0,2))
      if (sede) setForm(f => ({ ...f, sede_inps: sede.denominazione, sede_inps_indirizzo: sede.indirizzo }))
    }
  }

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const setAllegato = (k: string, v: boolean) => setForm(f => ({ ...f, allegati: { ...f.allegati, [k]: v } }))

  const allegatiPerTipo: Record<string, string[]> = {
    accompagnamento: ['allto01', 'allto02', 'allto03', 'allto04', 'allto07', 'allto08'],
    pensione100: ['allto01', 'allto02', 'allto03', 'allto04', 'allto05', 'allto07', 'allto08'],
    assegno_invalidita: ['allto01', 'allto02', 'allto03', 'allto04', 'allto05', 'allto07', 'allto08'],
    frequenza: ['allto01', 'allto02', 'allto03', 'allto04', 'allto06', 'allto07', 'allto08'],
  }

  const allegatiLabel: Record<string, string> = {
    allto01: 'Allegato 1 — Certificato medico / domanda',
    allto02: 'Allegato 2 — Verbale INPS',
    allto03: 'Allegato 3 — Documentazione medica',
    allto04: 'Allegato 4 — Atto notorio',
    allto05: 'Allegato 5 — Collocamento mirato',
    allto06: 'Allegato 6 — Certificato frequenza',
    allto07: 'Allegato 7 — Esenzione soccombenza',
    allto08: 'Allegato 8 — Esenzione contributo unificato',
  }

  const allegatiVisibili = allegatiPerTipo[form.tipo_prestazione] || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.cliente_id) { setError('Seleziona un cliente.'); return }
    setLoading(true)
    setError('')

    const { data, error } = await supabase.from('pratiche').insert({
      studio_id: studioId,
      cliente_id: form.cliente_id,
      tipo_prestazione: form.tipo_prestazione,
      stato: form.stato,
      sede_inps: form.sede_inps,
      sede_inps_indirizzo: form.sede_inps_indirizzo,
      tribunale: form.tribunale,
      numero_rg: form.numero_rg,
      data_deposito: form.data_deposito || null,
      data_udienza: form.data_udienza || null,
      ctu_nome: form.ctu_nome,
      ctu_cognome: form.ctu_cognome,
      esito: form.esito || null,
      percentuale_invalidita: form.percentuale_invalidita || null,
      note_pratica: form.note_pratica,
      allegati: form.allegati,
    }).select().single()

    if (error) { setError('Errore: ' + error.message); setLoading(false); return }
    router.push(`/pratiche/${data.id}`)
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="card" style={{ marginBottom: '1.25rem' }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-primary)', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>{title}</h3>
      {children}
    </div>
  )

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
          {/* Selezione cliente */}
          <Section title="Cliente">
            <div style={{ position: 'relative' }}>
              <label className="label">Ricorrente *</label>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  className="input-field"
                  style={{ paddingLeft: 36 }}
                  placeholder="Cerca cliente per nome o CF..."
                  value={searchCliente}
                  onChange={e => { setSearchCliente(e.target.value); setShowClientiList(true) }}
                  onFocus={() => setShowClientiList(true)}
                />
              </div>
              {showClientiList && searchCliente && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                  background: 'white', border: '1px solid var(--color-border)', borderRadius: 8,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: 200, overflowY: 'auto', marginTop: 4
                }}>
                  {clientiFiltrati.slice(0, 8).map(c => (
                    <div key={c.id} onClick={() => selezionaCliente(c)} style={{
                      padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--color-border)',
                      fontSize: 14, transition: 'background 0.1s'
                    }} onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')} onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                      <strong>{c.cognome} {c.nome}</strong>
                      <span style={{ color: 'var(--color-text-muted)', marginLeft: 8, fontSize: 12, fontFamily: 'monospace' }}>{c.codice_fiscale}</span>
                      {c.comune_residenza && <span style={{ color: 'var(--color-text-muted)', marginLeft: 8, fontSize: 12 }}>— {c.comune_residenza}</span>}
                    </div>
                  ))}
                  {clientiFiltrati.length === 0 && (
                    <div style={{ padding: '10px 14px', color: 'var(--color-text-muted)', fontSize: 13 }}>
                      Nessun cliente trovato. <Link href="/clienti/nuovo" style={{ color: 'var(--color-primary)' }}>Aggiungi nuovo</Link>
                    </div>
                  )}
                </div>
              )}
            </div>
            {clienteSelezionato && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, fontSize: 13 }}>
                ✓ <strong>{clienteSelezionato.cognome} {clienteSelezionato.nome}</strong> — CF: {clienteSelezionato.codice_fiscale} — CAP: {clienteSelezionato.cap_residenza}
              </div>
            )}
          </Section>

          {/* Tipo prestazione e stato */}
          <Section title="Tipo di Pratica">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="label">Prestazione richiesta *</label>
                <select className="input-field" value={form.tipo_prestazione} onChange={e => set('tipo_prestazione', e.target.value)} required>
                  {TIPI_PRESTAZIONE.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Stato pratica</label>
                <select className="input-field" value={form.stato} onChange={e => set('stato', e.target.value)}>
                  {STATI.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
          </Section>

          {/* Dati processuali */}
          <Section title="Dati Processuali">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="label">Sede INPS convenuta</label>
                <input className="input-field" value={form.sede_inps} onChange={e => set('sede_inps', e.target.value)} placeholder="Es. INPS Sede di Napoli" />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="label">Indirizzo sede INPS</label>
                <input className="input-field" value={form.sede_inps_indirizzo} onChange={e => set('sede_inps_indirizzo', e.target.value)} />
              </div>
              <div>
                <label className="label">Tribunale competente</label>
                <input className="input-field" value={form.tribunale} onChange={e => set('tribunale', e.target.value)} placeholder="Es. Tribunale di Napoli" />
              </div>
              <div>
                <label className="label">Numero RG</label>
                <input className="input-field" value={form.numero_rg} onChange={e => set('numero_rg', e.target.value)} placeholder="Es. 1234/2024" />
              </div>
              <div>
                <label className="label">Data deposito ricorso</label>
                <input type="date" className="input-field" value={form.data_deposito} onChange={e => set('data_deposito', e.target.value)} />
              </div>
              <div>
                <label className="label">Data udienza</label>
                <input type="date" className="input-field" value={form.data_udienza} onChange={e => set('data_udienza', e.target.value)} />
              </div>
              <div>
                <label className="label">CTU — Nome</label>
                <input className="input-field" value={form.ctu_nome} onChange={e => set('ctu_nome', e.target.value)} />
              </div>
              <div>
                <label className="label">CTU — Cognome</label>
                <input className="input-field" value={form.ctu_cognome} onChange={e => set('ctu_cognome', e.target.value)} />
              </div>
            </div>
          </Section>

          {/* Esito */}
          <Section title="Esito">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="label">Esito pratica</label>
                <select className="input-field" value={form.esito} onChange={e => set('esito', e.target.value)}>
                  {ESITI.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Percentuale invalidità riconosciuta</label>
                <input className="input-field" value={form.percentuale_invalidita} onChange={e => set('percentuale_invalidita', e.target.value)} placeholder="Es. 100%" />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="label">Note</label>
                <textarea className="input-field" value={form.note_pratica} onChange={e => set('note_pratica', e.target.value)} rows={3} style={{ resize: 'vertical' }} />
              </div>
            </div>
          </Section>

          {/* Allegati */}
          <Section title={`Allegati previsti — ${TIPI_PRESTAZIONE.find(t => t.value === form.tipo_prestazione)?.label}`}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {allegatiVisibili.map(k => (
                <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 8, cursor: 'pointer', fontSize: 13, background: (form.allegati as any)[k] ? '#f0f9ff' : 'white', transition: 'all 0.15s' }}>
                  <input type="checkbox" checked={(form.allegati as any)[k]} onChange={e => setAllegato(k, e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }} />
                  {allegatiLabel[k]}
                </label>
              ))}
            </div>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 10 }}>
              Gli allegati visualizzati dipendono dal tipo di prestazione selezionato.
            </p>
          </Section>

          {error && <p style={{ color: 'var(--color-danger)', fontSize: 14, marginBottom: '1rem' }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Link href="/pratiche" className="btn-secondary" style={{ textDecoration: 'none' }}>Annulla</Link>
            <button type="submit" className="btn-primary" disabled={loading}>
              <Save size={16} /> {loading ? 'Salvataggio...' : 'Salva pratica'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
