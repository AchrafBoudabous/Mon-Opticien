'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { cn, locales, switchLocalePath } from '@/lib/utils'
import type { Locale } from '@/data/translations'

interface LanguageSwitcherProps {
  locale: Locale
  label: string
}

function Switcher({ locale, label }: LanguageSwitcherProps) {
  const pathname = usePathname()
  const search = useSearchParams().toString()

  return (
    <div role="group" aria-label={label} className="flex items-center rounded-full border border-line bg-surface/70 p-0.5">
      {locales.map((l) => (
        <Link
          key={l}
          href={`${switchLocalePath(pathname, l)}${search ? `?${search}` : ''}`}
          hrefLang={l}
          lang={l}
          aria-current={l === locale ? 'true' : undefined}
          className={cn(
            'rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-wide transition-colors duration-200',
            l === locale ? 'bg-ink text-white' : 'text-muted hover:text-ink'
          )}
        >
          {l}
        </Link>
      ))}
    </div>
  )
}

// useSearchParams needs a Suspense boundary so static pages are not forced to client-render.
export default function LanguageSwitcher(props: LanguageSwitcherProps) {
  return (
    <Suspense fallback={<div className="h-[30px] w-[74px] rounded-full border border-line" />}>
      <Switcher {...props} />
    </Suspense>
  )
}
