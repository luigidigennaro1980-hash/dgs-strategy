'use client'
import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import AppLayout from '@/components/layout/AppLayout'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, User } from 'lucide-react'
import Link from 'next/link'

const REGIONI = ['Abruzzo','Basilicata','Calabria','Campania','Emilia-Romagna','Friuli-Venezia Giulia','Lazio','Liguria','Lombardia','Marche','Molise','Piemonte','Puglia','Sardegna','Sicilia','Toscana','Trentino-Alto Adige','Umbria',"Valle d'Aosta",'Veneto']

export default function NuovoClientePage() {
  const router = useRouter()
  const studioIdRef = useRef('')
  const loadingRef = useRef(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profili').select('studio_id').eq('user_id', user.id).single().then(({ data }) => {
        if (data) studioIdRef.current = data.studio_id
      })
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (loadingRef.current) return
    loadingRef.current = true

    const form = e.currentTarget
    const get = (name: string) => (form.elements.namedItem(name) as HTMLInputElement)?.value || ''

    const supabase = createClient()
    const { data, error } = await supabase.from('clienti').insert({
      studio_id: studioIdRef.current,
      cognome: get('cognome'),
      nome: get('nome'),
      sesso: get('sesso'),
      codice_fiscale: get('codice_fiscale').toUpperCase(),
      data_nascita: get('data_nascita') || null,
      luogo_nascita: get('luogo_nascita'),
      provincia_nascita: get('provincia_nascita').toUpperCase(),
      indirizzo_residenza: get('indirizzo_residenza'),
      comune_residenza: get('comune_residenza'),
      provincia_residenza: get('provincia_residenza').toUpperCase(),
      cap_residenza: get('cap_residenza'),
      regione_residenza: get('regione_residenza'),
      telefono: get('telefono'),
      cellulare: get('cellulare'),
      email: get('email'),
      note: get('note'),
    }).select().single()

    loadingRef.current = false

    if (error) {
      const errEl = document.getElementById('form-error')
      if (errEl) errEl.textContent = 'Errore: ' + error.message
      return
    }
    router.push('/clienti')
  }

  const sectionStyle = {
    background: 'white', border: '1px solid var(--color-border)',
    borderRadius: 12, padding: '1.5rem', marginBottom: '1.25rem'
  }
  const titleStyle = {
    fontSize: 14, fontWeight: 600, color: 'var(--color-primary)',
    marginBottom: '1.25rem', paddingBottom: '0.75rem',
    borderBottom: '1px solid var(--color-border)'
  }
  const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }
  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 4 }
  const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }

  return (
    <AppLayout>
      <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: '1.5rem' }}>
          <Link href="/clienti" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', textDecoration: 'none', fontSize: 14 }}>
            <ArrowLeft size={16} /> Clienti
          </Link>
          <span style={{ color: '#e2e8f0' }}>/</span>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Nuovo cliente</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={20} color="white" />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Nuovo Cliente</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={sectionStyle}>
            <div style={titleStyle}>Dati Anagrafici</div>
            <div style={gridStyle}>
              <div><label style={labelStyle}>Cognome *</label><input name="cognome" required style={inputStyle} /></div>
              <div><label style={labelStyle}>Nome *</label><input name="nome" required style={inputStyle} /></div>
              <div><label style={labelStyle}>Sesso</label>
                <select name="sesso" style={inputStyle}>
                  <option value="M">Maschile</option>
                  <option value="F">Femminile</option>
                </select>
              </div>
              <div><label style={labelStyle}>Codice Fiscale *</label><input name="codice_fiscale" required maxLength={16} style={{ ...inputStyle, fontFamily: 'monospace', textTransform: 'uppercase' }} /></div>
              <div><label style={labelStyle}>Data di nascita</label><input name="data_nascita" type="date" style={inputStyle} /></div>
              <div><label style={labelStyle}>Luogo di nascita</label><input name="luogo_nascita" style={inputStyle} /></div>
              <div><label style={labelStyle}>Provincia nascita</label><input name="provincia_nascita" maxLength={2} placeholder="es. NA" style={{ ...inputStyle, textTransform: 'uppercase' }} /></div>
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={titleStyle}>Residenza</div>
            <div style={gridStyle}>
              <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Indirizzo</label><input name="indirizzo_residenza" placeholder="Via, numero civico" style={inputStyle} /></div>
              <div><label style={labelStyle}>Comune</label><input name="comune_residenza" style={inputStyle} /></div>
              <div><label style={labelStyle}>Provincia</label><input name="provincia_residenza" maxLength={2} placeholder="es. NA" style={{ ...inputStyle, textTransform: 'uppercase' }} /></div>
              <div><label style={labelStyle}>CAP</label><input name="cap_residenza" maxLength={5} placeholder="es. 80100" style={inputStyle} /></div>
              <div><label style={labelStyle}>Regione</label>
                <select name="regione_residenza" style={inputStyle}>
                  <option value="">Seleziona regione</option>
                  {REGIONI.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={titleStyle}>Recapiti</div>
            <div style={gridStyle}>
              <div><label style={labelStyle}>Telefono fisso</label><input name="telefono" style={inputStyle} /></div>
              <div><label style={labelStyle}>Cellulare</label><input name="cellulare" style={inputStyle} /></div>
              <div><label style={labelStyle}>Email</label><input name="email" type="email" style={inputStyle} /></div>
              <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Note</label><textarea name="note" rows={3} style={{ ...inputStyle, resize: 'vertical' }} /></div>
            </div>
          </div>

          <p id="form-error" style={{ color: 'var(--color-danger)', fontSize: 14, marginBottom: '1rem' }}></p>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Link href="/clienti" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border)', textDecoration: 'none', fontSize: 14, color: 'var(--color-text)' }}>Annulla</Link>
            <button type="submit" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, background: 'var(--color-primary)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
              <Save size={16} /> Salva cliente
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
