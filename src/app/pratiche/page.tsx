'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import AppLayout from '@/components/layout/AppLayout'
import Link from 'next/link'
import { Plus, Search, FolderOpen, ChevronRight, Filter } from 'lucide-react'

const statoLabel: Record<string, { label: string; cls: string }> = {
  nuova: { label: 'Nuova', cls: 'badge-gray' },
  in_corso: { label: 'In corso', cls: 'badge-blue' },
  sospesa: { label: 'Sospesa', cls: 'badge-amber' },
  conclusa: { label: 'Conclusa', cls: 'badge-green' },
}

const tipoLabel: Record<string, string> = {
  accompagnamento: 'Ind. Accompagnamento',
  pensione100: 'Pensione 100%',
  assegno_invalidita: 'Ass. Invalidità',
  frequenza: 'Ind. Frequenza',
}

export default function PratichePage() {
  const [pratiche, setPratiche] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [filtroStato, setFiltroStato] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profilo } = await supabase.from('profili').select('studio_id').eq('user_id', user.id).single()
      if (!profilo) return

      const { data } = await supabase
        .from('pratiche')
        .select('*, clienti(nome, cognome, codice_fiscale, comune_residenza)')
        .eq('studio_id', profilo.studio_id)
        .order('created_at', { ascending: false })

      setPratiche(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtrate = pratiche.filter(p => {
    const testo = `${p.clienti?.cognome} ${p.clienti?.nome} ${p.clienti?.codice_fiscale} ${p.numero_rg} ${p.tribunale}`.toLowerCase()
    return (
      testo.includes(search.toLowerCase()) &&
      (filtroStato ? p.stato === filtroStato : true) &&
      (filtroTipo ? p.tipo_prestazione === filtroTipo : true)
    )
  })

  return (
    <AppLayout>
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Pratiche ATP</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>{pratiche.length} pratiche totali</p>
          </div>
          <Link href="/pratiche/nuova" className="btn-primary" style={{ textDecoration: 'none' }}>
            <Plus size={16} /> Nuova pratica ATP
          </Link>
        </div>

        {/* Filtri */}
        <div style={{ display: 'flex', gap: 12, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input className="input-field" style={{ paddingLeft: 36 }} placeholder="Cerca cliente, RG, tribunale..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input-field" style={{ width: 'auto' }} value={filtroStato} onChange={e => setFiltroStato(e.target.value)}>
            <option value="">Tutti gli stati</option>
            <option value="nuova">Nuova</option>
            <option value="in_corso">In corso</option>
            <option value="sospesa">Sospesa</option>
            <option value="conclusa">Conclusa</option>
          </select>
          <select className="input-field" style={{ width: 'auto' }} value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
            <option value="">Tutti i tipi</option>
            <option value="accompagnamento">Ind. Accompagnamento</option>
            <option value="pensione100">Pensione 100%</option>
            <option value="assegno_invalidita">Ass. Invalidità</option>
            <option value="frequenza">Ind. Frequenza</option>
          </select>
        </div>

        <div className="card" style={{ padding: 0 }}>
          {loading ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Caricamento...</p>
          ) : filtrate.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <FolderOpen size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontSize: 14 }}>
                {search || filtroStato || filtroTipo ? 'Nessuna pratica trovata.' : <>Nessuna pratica. <Link href="/pratiche/nuova" style={{ color: 'var(--color-primary)' }}>Crea la prima</Link></>}
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: '#f8fafc' }}>
                  {['Cliente', 'Prestazione', 'Sede INPS', 'Tribunale', 'N° RG', 'Udienza', 'Stato', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrate.map(p => (
                  <tr key={p.id} className="table-row" onClick={() => window.location.href = `/pratiche/${p.id}`}>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ fontWeight: 500 }}>{p.clienti?.cognome} {p.clienti?.nome}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{p.clienti?.codice_fiscale}</div>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 13 }}>{tipoLabel[p.tipo_prestazione] || p.tipo_prestazione}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--color-text-muted)' }}>{p.sede_inps || '—'}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--color-text-muted)' }}>{p.tribunale || '—'}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{p.numero_rg || '—'}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--color-text-muted)' }}>
                      {p.data_udienza ? new Date(p.data_udienza).toLocaleDateString('it-IT') : '—'}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span className={`badge ${statoLabel[p.stato]?.cls || 'badge-gray'}`}>{statoLabel[p.stato]?.label || p.stato}</span>
                    </td>
                    <td style={{ padding: '13px 16px' }}><ChevronRight size={16} color="var(--color-text-muted)" /></td>
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
