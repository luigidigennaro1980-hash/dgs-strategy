'use client'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Sidebar from './Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const initialized = useRef(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const supabase = createClient()
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const emailEl = document.getElementById('sidebar-email')
      if (emailEl) emailEl.textContent = user.email || ''

      const { data: profilo } = await supabase
        .from('profili')
        .select('studio_id, studi(nome)')
        .eq('user_id', user.id)
        .single()

      if (profilo?.studi) {
        const nomeEl = document.getElementById('sidebar-studio')
        if (nomeEl) nomeEl.textContent = (profilo.studi as any).nome
      }

      const loader = document.getElementById('app-loader')
      const content = document.getElementById('app-content')
      if (loader) loader.style.display = 'none'
      if (content) content.style.display = 'flex'
    }
    init()
  }, [])

  return (
    <>
      <div id="app-loader" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Caricamento...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
      <div id="app-content" style={{ display: 'none', minHeight: '100vh' }}>
        <Sidebar studioNome="" utenteEmail="" />
        <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, minHeight: '100vh', background: 'var(--color-bg)' }}>
          {children}
        </main>
      </div>
    </>
  )
}
