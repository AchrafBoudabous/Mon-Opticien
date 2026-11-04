'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { getTranslations } from '@/data/translations'
import { buttonClass } from '@/components/ui/button'
import { isValidLocale } from '@/lib/utils'

// not-found.tsx receives no params, so the locale is read from the URL on the client.
// (Reading request headers here would force ISR pages that call notFound() to go dynamic.)
export default function NotFoundContent() {
  const params = useParams<{ locale?: string }>()
  const locale = params?.locale && isValidLocale(params.locale) ? params.locale : 'fr'
  const t = getTranslations(locale).not_found

  return (
    <section className="container flex min-h-[80vh] flex-col items-center justify-center pb-20 pt-32 text-center">
      {/* React 19 hoists this into <head>; keeps the tab title right after client-side rendering. */}
      <title>{`404 · ${t.title}`}</title>
      <svg viewBox="0 0 220 90" className="mb-8 h-20 w-auto text-ink" aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round">
          <circle cx="62" cy="50" r="30" />
          <circle cx="158" cy="50" r="30" />
          <path d="M92 46c10-10 26-10 36 0" />
          <path d="M32 44 12 24M188 44l20-20" />
        </g>
        <path d="M150 34l16 32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity=".35" />
      </svg>
      <p className="eyebrow">{t.code}</p>
      <h1 className="mt-4 max-w-2xl font-serif text-display-lg text-ink">{t.title}</h1>
      <p className="mt-4 max-w-md text-muted">{t.text}</p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link href={`/${locale}`} className={buttonClass({ variant: 'primary', size: 'lg' })}>
          {t.home}
        </Link>
        <Link href={`/${locale}/products`} className={buttonClass({ variant: 'secondary', size: 'lg', className: 'group' })}>
          {t.collection}
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
        <Link href={`/${locale}/contact`} className={buttonClass({ variant: 'ghost', size: 'lg' })}>
          {t.contact}
        </Link>
      </div>
    </section>
  )
}
