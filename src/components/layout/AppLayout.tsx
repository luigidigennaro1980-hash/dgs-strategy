'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Sidebar from './Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [studioNome, setStudioNome] = useState('')
  const [utenteEmail, setUtenteEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUtenteEmail(user.email || '')

      const { data: studio } = await supabase
        .from('studi')
        .select('nome')
        .eq('id', user.user_metadata?.studio_id)
        .single()

      if (studio) setStudioNome(studio.nome)
      else {
        const { data: profilo } = await supabase
          .from('profili')
          .select('studio_id, studi(nome)')
          .eq('user_id', user.id)
          .single()
        if (profilo?.studi) setStudioNome((profilo.studi as any).nome)
      }
      setLoading(false)
    }
    init()
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Caricamento...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar studioNome={studioNome} utenteEmail={utenteEmail} />
      <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, minHeight: '100vh', background: 'var(--color-bg)' }}>
        {children}
      </main>
    </div>
  )
}
