'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import AppLayout from '@/components/layout/AppLayout'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, User } from 'lucide-react'
import Link from 'next/link'

const REGIONI = ['Abruzzo','Basilicata','Calabria','Campania','Emilia-Romagna','Friuli-Venezia Giulia','Lazio','Liguria','Lombardia','Marche','Molise','Piemonte','Puglia','Sardegna','Sicilia','Toscana','Trentino-Alto Adige','Umbria','Valle d\'Aosta','Veneto']

export default function NuovoClientePage() {
  const [form, setForm] = useState({
    nome: '', cognome: '', codice_fiscale: '',
    data_nascita: '', luogo_nascita: '', provincia_nascita: '',
    sesso: 'M',
    indirizzo_residenza: '', comune_residenza: '', provincia_residenza: '', cap_residenza: '', regione_residenza: '',
    telefono: '', cellulare: '', email: '',
    note: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [studioId, setStudioId] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profilo } = await supabase.from('profili').select('studio_id').eq('user_id', user.id).single()
      if (profilo) setStudioId(profilo.studio_id)
    }
    init()
  }, [])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.from('clienti').insert({
      ...form,
      studio_id: studioId,
      codice_fiscale: form.codice_fiscale.toUpperCase()
    }).select().single()

    if (error) { setError('Errore nel salvataggio: ' + error.message); setLoading(false); return }
    router.push(`/clienti/${data.id}`)
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="card" style={{ marginBottom: '1.25rem' }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-primary)', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>{title}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>{children}</div>
    </div>
  )

  const Field = ({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) => (
    <div style={{ gridColumn: full ? '1/-1' : undefined }}>
      <label className="label">{label}</label>
      {children}
    </div>
  )

  return (
    <AppLayout>
      <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: '1.5rem' }}>
          <Link href="/clienti" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: 14 }}>
            <ArrowLeft size={16} /> Clienti
          </Link>
          <span style={{ color: 'var(--color-border)' }}>/</span>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Nuovo cliente</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={20} color="white" />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Nuovo Cliente</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Section title="Dati Anagrafici">
            <Field label="Cognome *">
              <input className="input-field" value={form.cognome} onChange={e => set('cognome', e.target.value)} required />
            </Field>
            <Field label="Nome *">
              <input className="input-field" value={form.nome} onChange={e => set('nome', e.target.value)} required />
            </Field>
            <Field label="Sesso">
              <select className="input-field" value={form.sesso} onChange={e => set('sesso', e.target.value)}>
                <option value="M">Maschile</option>
                <option value="F">Femminile</option>
              </select>
            </Field>
            <Field label="Codice Fiscale *">
              <input className="input-field" value={form.codice_fiscale} onChange={e => set('codice_fiscale', e.target.value.toUpperCase())} maxLength={16} style={{ fontFamily: 'monospace' }} required />
            </Field>
            <Field label="Data di nascita">
              <input type="date" className="input-field" value={form.data_nascita} onChange={e => set('data_nascita', e.target.value)} />
            </Field>
            <Field label="Luogo di nascita">
              <input className="input-field" value={form.luogo_nascita} onChange={e => set('luogo_nascita', e.target.value)} />
            </Field>
            <Field label="Provincia di nascita">
              <input className="input-field" value={form.provincia_nascita} onChange={e => set('provincia_nascita', e.target.value)} maxLength={2} style={{ textTransform: 'uppercase' }} placeholder="es. NA" />
            </Field>
          </Section>

          <Section title="Residenza">
            <Field label="Indirizzo" full>
              <input className="input-field" value={form.indirizzo_residenza} onChange={e => set('indirizzo_residenza', e.target.value)} placeholder="Via, numero civico" />
            </Field>
            <Field label="Comune">
              <input className="input-field" value={form.comune_residenza} onChange={e => set('comune_residenza', e.target.value)} />
            </Field>
            <Field label="Provincia">
              <input className="input-field" value={form.provincia_residenza} onChange={e => set('provincia_residenza', e.target.value)} maxLength={2} style={{ textTransform: 'uppercase' }} placeholder="es. NA" />
            </Field>
            <Field label="CAP">
              <input className="input-field" value={form.cap_residenza} onChange={e => set('cap_residenza', e.target.value)} maxLength={5} placeholder="es. 80100" />
            </Field>
            <Field label="Regione">
              <select className="input-field" value={form.regione_residenza} onChange={e => set('regione_residenza', e.target.value)}>
                <option value="">Seleziona regione</option>
                {REGIONI.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
          </Section>

          <Section title="Recapiti">
            <Field label="Telefono fisso">
              <input className="input-field" value={form.telefono} onChange={e => set('telefono', e.target.value)} />
            </Field>
            <Field label="Cellulare">
              <input className="input-field" value={form.cellulare} onChange={e => set('cellulare', e.target.value)} />
            </Field>
            <Field label="Email">
              <input type="email" className="input-field" value={form.email} onChange={e => set('email', e.target.value)} />
            </Field>
            <Field label="Note" full>
              <textarea className="input-field" value={form.note} onChange={e => set('note', e.target.value)} rows={3} style={{ resize: 'vertical' }} />
            </Field>
          </Section>

          {error && <p style={{ color: 'var(--color-danger)', fontSize: 14, marginBottom: '1rem' }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Link href="/clienti" className="btn-secondary" style={{ textDecoration: 'none' }}>Annulla</Link>
            <button type="submit" className="btn-primary" disabled={loading}>
              <Save size={16} /> {loading ? 'Salvataggio...' : 'Salva cliente'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
