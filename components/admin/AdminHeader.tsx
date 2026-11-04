import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import LogoutButton from '@/components/admin/LogoutButton'
import { LogoMark } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/admin', key: 'products', label: 'Produits' },
  { href: '/admin/reservations', key: 'reservations', label: 'Réservations' },
  { href: '/admin/labels', key: 'labels', label: 'Étiquettes QR' },
] as const

export default function AdminHeader({ active }: { active: (typeof TABS)[number]['key'] }) {
  return (
    <header className="border-b border-line bg-surface print:hidden">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <LogoMark size={30} />
          <span className="font-serif text-xl text-ink">Mon Opticien</span>
          <span className="rounded-full bg-sand px-2 py-0.5 text-xs text-muted">Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="/fr"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
          >
            Voir le site <ExternalLink size={14} aria-hidden="true" />
          </a>
          <LogoutButton />
        </div>
      </div>
      <nav aria-label="Administration" className="mx-auto max-w-7xl px-6">
        <ul className="-mb-px flex gap-6 text-sm">
          {TABS.map((tab) => (
            <li key={tab.key}>
              <Link
                href={tab.href}
                aria-current={active === tab.key ? 'page' : undefined}
                className={cn(
                  'inline-block border-b-2 pb-3 transition-colors',
                  active === tab.key ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'
                )}
              >
                {tab.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
