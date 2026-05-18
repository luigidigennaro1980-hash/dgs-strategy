'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import AppLayout from '@/components/layout/AppLayout'
import { Users, FolderOpen, Clock, CheckCircle, TrendingUp, Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface Stats {
  clienti: number
  pratiche: number
  in_corso: number
  concluse: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ clienti: 0, pratiche: 0, in_corso: 0, concluse: 0 })
  const [pratiche, setPratiche] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profilo } = await supabase.from('profili').select('studio_id').eq('user_id', user.id).single()
      if (!profilo) return

      const sid = profilo.studio_id

      const [{ count: cCount }, { count: pCount }, { count: icCount }, { count: conCount }, { data: recenti }] = await Promise.all([
        supabase.from('clienti').select('*', { count: 'exact', head: true }).eq('studio_id', sid),
        supabase.from('pratiche').select('*', { count: 'exact', head: true }).eq('studio_id', sid),
        supabase.from('pratiche').select('*', { count: 'exact', head: true }).eq('studio_id', sid).eq('stato', 'in_corso'),
        supabase.from('pratiche').select('*', { count: 'exact', head: true }).eq('studio_id', sid).eq('stato', 'conclusa'),
        supabase.from('pratiche').select('*, clienti(nome, cognome)').eq('studio_id', sid).order('created_at', { ascending: false }).limit(5)
      ])

      setStats({ clienti: cCount || 0, pratiche: pCount || 0, in_corso: icCount || 0, concluse: conCount || 0 })
      setPratiche(recenti || [])
      setLoading(false)
    }
    load()
  }, [])

  const statoLabel: Record<string, { label: string; cls: string }> = {
    in_corso: { label: 'In corso', cls: 'badge-blue' },
    conclusa: { label: 'Conclusa', cls: 'badge-green' },
    sospesa: { label: 'Sospesa', cls: 'badge-amber' },
    nuova: { label: 'Nuova', cls: 'badge-gray' },
  }

  const tipoLabel: Record<string, string> = {
    accompagnamento: 'Ind. Accompagnamento',
    pensione100: 'Pensione 100%',
    assegno_invalidita: 'Assegno Invalidità',
    frequenza: 'Frequenza',
  }

  return (
    <AppLayout>
      <div style={{ padding: '2rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>Dashboard</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
              {new Date().toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/clienti/nuovo" className="btn-secondary" style={{ textDecoration: 'none' }}>
              <Plus size={16} /> Nuovo cliente
            </Link>
            <Link href="/pratiche/nuova" className="btn-primary" style={{ textDecoration: 'none' }}>
              <Plus size={16} /> Nuova pratica ATP
            </Link>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: '2rem' }}>
          {[
            { icon: Users, label: 'Clienti totali', value: stats.clienti, color: '#3b82f6', bg: '#eff6ff' },
            { icon: FolderOpen, label: 'Pratiche ATP', value: stats.pratiche, color: '#8b5cf6', bg: '#f5f3ff' },
            { icon: Clock, label: 'In corso', value: stats.in_corso, color: '#f59e0b', bg: '#fffbeb' },
            { icon: CheckCircle, label: 'Concluse', value: stats.concluse, color: '#10b981', bg: '#ecfdf5' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={22} color={color} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1 }}>{loading ? '—' : value}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Pratiche recenti */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>Pratiche recenti</h2>
            <Link href="/pratiche" style={{ color: 'var(--color-primary)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
              Vedi tutte <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, textAlign: 'center', padding: '2rem' }}>Caricamento...</p>
          ) : pratiche.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
              <FolderOpen size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontSize: 14 }}>Nessuna pratica ancora. <Link href="/pratiche/nuova" style={{ color: 'var(--color-primary)' }}>Crea la prima</Link></p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Cliente', 'Tipo prestazione', 'Tribunale', 'N° RG', 'Stato', ''].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pratiche.map(p => (
                  <tr key={p.id} className="table-row" onClick={() => window.location.href = `/pratiche/${p.id}`}>
                    <td style={{ padding: '12px' }}>
                      <span style={{ fontWeight: 500 }}>{p.clienti?.cognome} {p.clienti?.nome}</span>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--color-text-muted)' }}>{tipoLabel[p.tipo_prestazione] || p.tipo_prestazione}</td>
                    <td style={{ padding: '12px', color: 'var(--color-text-muted)' }}>{p.tribunale || '—'}</td>
                    <td style={{ padding: '12px', color: 'var(--color-text-muted)' }}>{p.numero_rg || '—'}</td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge ${statoLabel[p.stato]?.cls || 'badge-gray'}`}>
                        {statoLabel[p.stato]?.label || p.stato}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <ArrowRight size={14} color="var(--color-text-muted)" />
                    </td>
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
