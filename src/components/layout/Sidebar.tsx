'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, FolderOpen, FileText,
  Settings, LogOut, Scale, ChevronRight
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/clienti', icon: Users, label: 'Clienti' },
  { href: '/pratiche', icon: FolderOpen, label: 'Pratiche ATP' },
  { href: '/template', icon: FileText, label: 'Template Atti' },
  { href: '/impostazioni', icon: Settings, label: 'Impostazioni' },
]

export default function Sidebar({ studioNome, utenteEmail }: { studioNome: string; utenteEmail: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      minHeight: '100vh',
      background: 'var(--color-primary)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0, left: 0,
      zIndex: 50,
      boxShadow: '4px 0 20px rgba(0,0,0,0.15)'
    }}>
      {/* Logo */}
      <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'var(--color-gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Scale size={18} color="white" />
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em' }}>DGS Strategy</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Gestionale Studio</div>
          </div>
        </div>
      </div>

      {/* Studio info */}
      <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Studio</div>
        <div style={{ color: 'white', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{studioNome}</div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '0.75rem' }}>
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className={`sidebar-link ${pathname.startsWith(href) ? 'active' : ''}`} style={{ marginBottom: 2, textDecoration: 'none' }}>
            <Icon size={18} />
            <span>{label}</span>
            {pathname.startsWith(href) && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
          </Link>
        ))}
      </nav>

      {/* Bottom user info + logout */}
      <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{utenteEmail}</div>
        <button onClick={handleLogout} className="sidebar-link" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px' }}>
          <LogOut size={16} />
          <span>Esci</span>
        </button>
      </div>
    </aside>
  )
}
