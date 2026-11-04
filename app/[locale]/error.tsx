'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { RotateCcw } from 'lucide-react'
import { getTranslations } from '@/data/translations'
import { buttonClass } from '@/components/ui/button'
import WhatsAppCta from '@/components/ui/WhatsAppCta'

export default function LocaleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { locale } = useParams<{ locale: string }>()
  const t = getTranslations(locale ?? 'fr')

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <section className="container flex min-h-[70vh] flex-col items-center justify-center pb-20 pt-32 text-center">
      <h1 className="font-serif text-display-md text-ink">{t.error.title}</h1>
      <p className="mt-3 max-w-md text-muted">{t.error.text}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={reset} className={buttonClass({ variant: 'primary', size: 'lg' })}>
          <RotateCcw size={16} aria-hidden="true" />
          {t.error.retry}
        </button>
        <WhatsAppCta label={t.common.whatsapp} placement="error" variant="whatsapp" />
      </div>
    </section>
  )
}
