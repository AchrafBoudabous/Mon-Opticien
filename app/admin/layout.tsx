import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { fontSans, fontSerif } from '@/lib/fonts'
import '../globals.css'

// Separate root layout: the admin is French-only and must never be indexed.
export const metadata: Metadata = {
  title: { default: 'Administration', template: '%s · Admin Mon Opticien' },
  robots: { index: false, follow: false, nocache: true },
  icons: { icon: [{ url: '/favicon.ico' }, { url: '/favicon.svg', type: 'image/svg+xml' }] },
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${fontSans.variable} ${fontSerif.variable}`}>
      <body className="min-h-screen bg-paper">{children}</body>
    </html>
  )
}
