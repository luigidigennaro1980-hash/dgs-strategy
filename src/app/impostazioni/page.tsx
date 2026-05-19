'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import AppLayout from '@/components/layout/AppLayout'
import { Users, Plus, Trash2, Mail, Shield, User } from 'lucide-react'

export default function ImpostazioniPage() {
  const [operatori, setOperatori] = useState<any[]>([])
  const [studioId, setStudioId] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errore, setErrore] = useState('')
  const [successo, setSuccesso] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profilo } = await supabase
        .from('profili')
        .select('studio_id, ruolo, studi(nome, owner_id)')
        .eq('user_id', user.id)
        .single()

      if (!profilo) return
      setStudioId(profilo.studio_id)
      setIsAdmin(profilo.ruolo === 'admin')

      if (profilo.ruolo !== 'admin') { setLoading(false); return }

      const { data: ops } = await supabase
        .from('profili')
        .select('id, user_id, ruolo, nome_completo, attivo, created_at')
        .eq('studio_id', profilo.studio_id)
        .order('created_at')

      setOperatori(ops || [])
      setLoading(false)
    }
    load()
  }, [])

  const handleInvita = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setErrore('')
    setSuccesso('')

    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const nome = (form.elements.namedItem('nome') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { setErrore('Errore: ' + error.message); setSaving(false); return }

    if (data.user) {
      const { error: profiloError } = await supabase.from('profili').insert({
        user_id: data.user.id,
        studio_id: studioId,
        ruolo: 'operatore',
        nome_completo: nome,
        attivo: true
      })
      if (profiloError) { setErrore('Errore nel salvataggio profilo: ' + profiloError.message); setSaving(false); return }

      setSuccesso(`Operatore ${nome} creato con successo! Credenziali: ${email} / ${password}`)
      setShowForm(false)
      form.reset()

      const { data: ops } = await supabase.from('profili').select('id, user_id, ruolo, nome_completo, attivo, created_at').eq('studio_id', studioId).order('created_at')
      setOperatori(ops || [])
    }
    setSaving(false)
  }

  const toggleAttivo = async (id: string, attivo: boolean) => {
    await supabase.from('profili').update({ attivo: !attivo }).eq('id', id)
    setOperatori(ops => ops.map(o => o.id === id ? { ...o, attivo: !attivo } : o))
  }

  const s = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }
  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 4 }

  return (
    <AppLayout>
      <div style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={20} color="white" />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Impostazioni Studio</h1>
        </div>

        {!isAdmin ? (
          <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: 12, padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <Shield size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p>Solo l'amministratore può accedere alle impostazioni.</p>
          </div>
        ) : (
          <>
            {/* Lista operatori */}
            <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.5rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: 16, fontWeight: 600 }}>Operatori dello studio</h2>
                <button onClick={() => setShowForm(!showForm)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, background: 'var(--color-primary)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                  <Plus size={15} /> Nuovo operatore
                </button>
              </div>

              {loading ? (
                <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Caricamento...</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', background: '#f8fafc' }}>
                      {['Nome', 'Ruolo', 'Stato', 'Azioni'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {operatori.map(op => (
                      <tr key={op.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: op.ruolo === 'admin' ? 'var(--color-primary)' : '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <User size={14} color="white" />
                            </div>
                            <span style={{ fontWeight: 500, fontSize: 14 }}>{op.nome_completo || 'Senza nome'}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span className={`badge ${op.ruolo === 'admin' ? 'badge-blue' : 'badge-gray'}`}>
                            {op.ruolo === 'admin' ? 'Amministratore' : 'Operatore'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span className={`badge ${op.attivo ? 'badge-green' : 'badge-red'}`}>
                            {op.attivo ? 'Attivo' : 'Disattivato'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {op.ruolo !== 'admin' && (
                            <button onClick={() => toggleAttivo(op.id, op.attivo)} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--color-border)', background: 'white', cursor: 'pointer', color: op.attivo ? '#dc2626' : '#16a34a' }}>
                              {op.attivo ? 'Disattiva' : 'Attiva'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Form nuovo operatore */}
            {showForm && (
              <div style={{ background: 'white', border: '1px solid #bae6fd', borderRadius: 12, padding: '1.5rem' }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: '1.25rem', color: 'var(--color-primary)' }}>Crea nuovo operatore</h3>
                <form onSubmit={handleInvita}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={labelStyle}>Nome completo *</label>
                      <input name="nome" required style={s} placeholder="Es. Mario Rossi" />
                    </div>
                    <div>
                      <label style={labelStyle}>Email *</label>
                      <input name="email" type="email" required style={s} placeholder="operatore@studio.it" />
                    </div>
                    <div>
                      <label style={labelStyle}>Password temporanea *</label>
                      <input name="password" required minLength={6} style={s} placeholder="Minimo 6 caratteri" />
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: '#64748b', marginBottom: '1rem' }}>
                    ⚠️ Comunica email e password all'operatore. Potrà cambiarla dal suo profilo.
                  </p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" onClick={() => setShowForm(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'white', cursor: 'pointer', fontSize: 14 }}>Annulla</button>
                    <button type="submit" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, background: 'var(--color-primary)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
                      <Plus size={15} /> {saving ? 'Creazione...' : 'Crea operatore'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {successo && (
              <div style={{ marginTop: '1rem', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, color: '#166534', fontSize: 13 }}>
                ✓ {successo}
              </div>
            )}
            {errore && (
              <div style={{ marginTop: '1rem', padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13 }}>
                {errore}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}

