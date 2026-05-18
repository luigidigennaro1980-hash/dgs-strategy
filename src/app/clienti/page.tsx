'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import AppLayout from '@/components/layout/AppLayout'
import Link from 'next/link'
import { Plus, Search, User, Phone, Mail, MapPin, ChevronRight } from 'lucide-react'

export default function ClientiPage() {
  const [clienti, setClienti] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [studioId, setStudioId] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profilo } = await supabase.from('profili').select('studio_id').eq('user_id', user.id).single()
      if (!profilo) return
      setStudioId(profilo.studio_id)

      const { data } = await supabase
        .from('clienti')
        .select('*')
        .eq('studio_id', profilo.studio_id)
        .order('cognome', { ascending: true })

      setClienti(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtrati = clienti.filter(c =>
    `${c.nome} ${c.cognome} ${c.codice_fiscale} ${c.comune_residenza}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AppLayout>
      <div style={{ padding: '2rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Clienti</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>{clienti.length} clienti totali</p>
          </div>
          <Link href="/clienti/nuovo" className="btn-primary" style={{ textDecoration: 'none' }}>
            <Plus size={16} /> Nuovo cliente
          </Link>
        </div>

        {/* Barra di ricerca */}
        <div style={{ position: 'relative', marginBottom: '1.5rem', maxWidth: 400 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: 36 }}
            placeholder="Cerca per nome, CF, comune..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Tabella clienti */}
        <div className="card" style={{ padding: 0 }}>
          {loading ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Caricamento...</p>
          ) : filtrati.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <User size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontSize: 14 }}>
                {search ? 'Nessun cliente trovato.' : <>Nessun cliente ancora. <Link href="/clienti/nuovo" style={{ color: 'var(--color-primary)' }}>Aggiungi il primo</Link></>}
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: '#f8fafc' }}>
                  {['Cliente', 'Codice Fiscale', 'Data di nascita', 'Comune', 'Telefono', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrati.map(c => (
                  <tr key={c.id} className="table-row" onClick={() => window.location.href = `/clienti/${c.id}`}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: 'var(--color-primary)', color: 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 600, flexShrink: 0
                        }}>
                          {c.nome?.[0]}{c.cognome?.[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{c.cognome} {c.nome}</div>
                          {c.email && <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{c.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: 13, color: 'var(--color-text-muted)' }}>{c.codice_fiscale}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--color-text-muted)', fontSize: 13 }}>
                      {c.data_nascita ? new Date(c.data_nascita).toLocaleDateString('it-IT') : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--color-text-muted)', fontSize: 13 }}>{c.comune_residenza || '—'}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--color-text-muted)', fontSize: 13 }}>{c.telefono || '—'}</td>
                    <td style={{ padding: '14px 16px' }}><ChevronRight size={16} color="var(--color-text-muted)" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
