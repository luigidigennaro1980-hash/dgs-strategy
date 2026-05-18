'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Scale, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [studioNome, setStudioNome] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError('Credenziali non valide. Riprova.'); setLoading(false); return }
      router.push('/dashboard')
    } else {
      if (!studioNome.trim()) { setError('Inserisci il nome dello studio.'); setLoading(false); return }

      const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) { setError(signUpError.message); setLoading(false); return }

      if (data.user) {
        const { data: studio, error: studioError } = await supabase
          .from('studi')
          .insert({ nome: studioNome, owner_id: data.user.id })
          .select()
          .single()

        if (studioError) { setError('Errore nella creazione dello studio.'); setLoading(false); return }

        await supabase.from('profili').insert({
          user_id: data.user.id,
          studio_id: studio.id,
          ruolo: 'admin',
          nome_completo: email.split('@')[0]
        })

        router.push('/dashboard')
      }
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f1e33 0%, #1e3a5f 50%, #0f1e33 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      {/* Background decorativo */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden',
        background: `radial-gradient(ellipse at 20% 50%, rgba(201,168,76,0.08) 0%, transparent 50%),
                     radial-gradient(ellipse at 80% 20%, rgba(30,58,95,0.3) 0%, transparent 50%)`
      }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'var(--color-gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 8px 24px rgba(201,168,76,0.4)'
          }}>
            <Scale size={28} color="white" />
          </div>
          <h1 style={{ color: 'white', fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>DGS Strategy</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Gestionale Studio Legale</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.97)',
          borderRadius: 16,
          padding: '2rem',
          boxShadow: '0 24px 64px rgba(0,0,0,0.3)'
        }}>
          {/* Tab switch */}
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 4, marginBottom: '1.5rem' }}>
            {(['login', 'register'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontWeight: 500, fontSize: 13, transition: 'all 0.2s',
                background: mode === m ? 'white' : 'transparent',
                color: mode === m ? 'var(--color-primary)' : 'var(--color-text-muted)',
                boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
              }}>
                {m === 'login' ? 'Accedi' : 'Registra Studio'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Nome Studio / Avvocato</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Es. Studio Legale Di Gennaro"
                  value={studioNome}
                  onChange={e => setStudioNome(e.target.value)}
                  required
                />
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label className="label">Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  type="email"
                  className="input-field"
                  style={{ paddingLeft: 36 }}
                  placeholder="avvocato@studio.it"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  style={{ paddingLeft: 36, paddingRight: 40 }}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required minLength={6}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)'
                }}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, marginBottom: '1rem'
              }}>
                <AlertCircle size={15} color="#dc2626" />
                <span style={{ color: '#dc2626', fontSize: 13 }}>{error}</span>
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px' }} disabled={loading}>
              {loading ? 'Attendere...' : mode === 'login' ? 'Accedi' : 'Crea Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
