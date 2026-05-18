'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import AppLayout from '@/components/layout/AppLayout'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, User } from 'lucide-react'
import Link from 'next/link'

const REGIONI = ['Abruzzo','Basilicata','Calabria','Campania','Emilia-Romagna','Friuli-Venezia Giulia','Lazio','Liguria','Lombardia','Marche','Molise','Piemonte','Puglia','Sardegna','Sicilia','Toscana','Trentino-Alto Adige','Umbria','Valle d\'Aosta','Veneto']

export default function NuovoClientePage() {
  const [cognome, setCognome] = useState('')
  const [nome, setNome] = useState('')
  const [sesso, setSesso] = useState('M')
  const [codiceFiscale, setCodiceFiscale] = useState('')
  const [dataNascita, setDataNascita] = useState('')
  const [luogoNascita, setLuogoNascita] = useState('')
  const [provinciaNascita, setProvinciaNascita] = useState('')
  const [indirizzoResidenza, setIndirizzoResidenza] = useState('')
  const [comuneResidenza, setComuneResidenza] = useState('')
  const [provinciaResidenza, setProvinciaResidenza] = useState('')
  const [capResidenza, setCapResidenza] = useState('')
  const [regioneResidenza, setRegioneResidenza] = useState('')
  const [telefono, setTelefono] = useState('')
  const [cellulare, setCellulare] = useState('')
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.from('clienti').insert({
      studio_id: studioId,
      cognome,
      nome,
      sesso,
      codice_fiscale: codiceFiscale.toUpperCase(),
      data_nascita: dataNascita || null,
      luogo_nascita: luogoNascita,
      provincia_nascita: provinciaNascita,
      indirizzo_residenza: indirizzoResidenza,
      comune_residenza: comuneResidenza,
      provincia_residenza: provinciaResidenza,
      cap_residenza: capResidenza,
      regione_residenza: regioneResidenza,
      telefono,
      cellulare,
      email,
      note,
    }).select().single()

    if (error) { setError('Errore nel salvataggio: ' + error.message); setLoading(false); return }
    router.push(`/clienti`)
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
              <input className="input-field" value={cognome} onChange={e => setCognome(e.target.value)} required />
            </Field>
            <Field label="Nome *">
              <input className="input-field" value={nome} onChange={e => setNome(e.target.value)} required />
            </Field>
            <Field label="Sesso">
              <select className="input-field" value={sesso} onChange={e => setSesso(e.target.value)}>
                <option value="M">Maschile</option>
                <option value="F">Femminile</option>
              </select>
            </Field>
            <Field label="Codice Fiscale *">
              <input className="input-field" value={codiceFiscale} onChange={e => setCodiceFiscale(e.target.value.toUpperCase())} maxLength={16} style={{ fontFamily: 'monospace' }} required />
            </Field>
            <Field label="Data di nascita">
              <input type="date" className="input-field" value={dataNascita} onChange={e => setDataNascita(e.target.value)} />
            </Field>
            <Field label="Luogo di nascita">
              <input className="input-field" value={luogoNascita} onChange={e => setLuogoNascita(e.target.value)} />
            </Field>
            <Field label="Provincia di nascita">
              <input className="input-field" value={provinciaNascita} onChange={e => setProvinciaNascita(e.target.value.toUpperCase())} maxLength={2} placeholder="es. NA" />
            </Field>
          </Section>

          <Section title="Residenza">
            <Field label="Indirizzo" full>
              <input className="input-field" value={indirizzoResidenza} onChange={e => setIndirizzoResidenza(e.target.value)} placeholder="Via, numero civico" />
            </Field>
            <Field label="Comune">
              <input className="input-field" value={comuneResidenza} onChange={e => setComuneResidenza(e.target.value)} />
            </Field>
            <Field label="Provincia">
              <input className="input-field" value={provinciaResidenza} onChange={e => setProvinciaResidenza(e.target.value.toUpperCase())} maxLength={2} placeholder="es. NA" />
            </Field>
            <Field label="CAP">
              <input className="input-field" value={capResidenza} onChange={e => setCapResidenza(e.target.value)} maxLength={5} placeholder="es. 80100" />
            </Field>
            <Field label="Regione">
              <select className="input-field" value={regioneResidenza} onChange={e => setRegioneResidenza(e.target.value)}>
                <option value="">Seleziona regione</option>
                {REGIONI.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
          </Section>

          <Section title="Recapiti">
            <Field label="Telefono fisso">
              <input className="input-field" value={telefono} onChange={e => setTelefono(e.target.value)} />
            </Field>
            <Field label="Cellulare">
              <input className="input-field" value={cellulare} onChange={e => setCellulare(e.target.value)} />
            </Field>
            <Field label="Email">
              <input type="email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} />
            </Field>
            <Field label="Note" full>
              <textarea className="input-field" value={note} onChange={e => setNote(e.target.value)} rows={3} style={{ resize: 'vertical' }} />
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
