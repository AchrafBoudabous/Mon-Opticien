'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import type { Locale, Translations } from '@/data/translations'
import LanguageSwitcher from './LanguageSwitcher'
import TrayButton from './tray/TrayButton'
import TrackedLink from '@/components/ui/TrackedLink'
import { LogoMark, WhatsAppIcon } from '@/components/ui/icons'
import { buttonClass } from '@/components/ui/button'
import { whatsappUrl } from '@/lib/site'
import { cn } from '@/lib/utils'

interface HeaderProps {
  locale: Locale
  nav: Translations['nav']
  tray: Translations['tray']
  prescriptionLabel: string
  whatsappLabel: string
  whatsappMessage: string
}

export default function Header({ locale, nav, tray, prescriptionLabel, whatsappLabel, whatsappMessage }: HeaderProps) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the mobile menu on navigation and on Escape.
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  const links = [
    { href: `/${locale}`, label: nav.home },
    { href: `/${locale}/products`, label: nav.collection },
    { href: `/${locale}/about`, label: nav.about },
    { href: `/${locale}/delivery`, label: nav.delivery },
    { href: `/${locale}/prescription`, label: prescriptionLabel },
    { href: `/${locale}/contact`, label: nav.contact },
  ]

  const isActive = (href: string) =>
    href === `/${locale}` ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,border-color] duration-300',
        scrolled || open
          ? 'border-b border-line bg-paper/85 shadow-[0_1px_0_rgba(0,0,0,0.02)] backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        {nav.skip_to_content}
      </a>

      <div className="container flex h-16 items-center justify-between gap-4 md:h-[72px]">
        <Link href={`/${locale}`} className="group flex items-center gap-2.5" aria-label="Mon Opticien">
          <LogoMark size={34} className="transition-transform duration-300 group-hover:rotate-[-6deg]" />
          <span className="leading-none">
            <span className="block whitespace-nowrap font-serif text-xl text-ink">Mon Opticien</span>
            <span className="hidden text-[11px] tracking-wide text-muted sm:block">Montplaisir · Tunis</span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-0.5">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                  className={cn(
                    'relative rounded-full px-3 py-2 text-sm transition-colors duration-200',
                    isActive(link.href) ? 'text-ink' : 'text-muted hover:text-ink'
                  )}
                >
                  {link.label}
                  {isActive(link.href) && (
                    <span className="absolute inset-x-3 -bottom-0.5 h-px bg-ink" aria-hidden="true" />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <LanguageSwitcher locale={locale} label={nav.language} />
          <TrayButton locale={locale} t={tray} />
          {/* CTA stays visible on every breakpoint, so it is always above the fold. */}
          <TrackedLink
            href={whatsappUrl(whatsappMessage)}
            event="whatsapp_click"
            placement="header"
            external
            className={buttonClass({ variant: 'primary', size: 'sm', className: 'px-3 sm:px-4' })}
            aria-label={whatsappLabel}
          >
            <WhatsAppIcon size={16} />
            <span className="hidden sm:inline">{whatsappLabel}</span>
          </TrackedLink>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="-mr-1 inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-sand lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? nav.menu_close : nav.menu_open}
          >
            {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        hidden={!open}
        className="h-[calc(100dvh-4rem)] overflow-y-auto border-t border-line bg-paper lg:hidden"
      >
        <nav aria-label="Mobile" className="container py-6">
          <ul className="space-y-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                  className={cn(
                    'flex items-center justify-between border-b border-line py-4 font-serif text-3xl transition-colors',
                    isActive(link.href) ? 'text-ink' : 'text-ink/60 hover:text-ink'
                  )}
                >
                  {link.label}
                  <span aria-hidden="true" className="text-base text-muted">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}
