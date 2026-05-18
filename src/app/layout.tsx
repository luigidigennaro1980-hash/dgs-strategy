import type { Metadata } from 'next'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'DGS Strategy — Gestionale Studio Legale',
  description: 'Gestionale per la gestione delle pratiche ATP e clienti dello studio legale',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  )
}
