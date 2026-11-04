import { AlertTriangle } from 'lucide-react'
import type { Metadata } from 'next'
import PageHero from '@/components/ui/PageHero'
import PrescriptionClient from '@/components/prescription/PrescriptionClient'
import { getTranslations, type Locale } from '@/data/translations'
import { pageMetadata } from '@/lib/seo'

interface PrescriptionPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PrescriptionPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = getTranslations(locale)
  return pageMetadata({
    locale: locale as Locale,
    path: '/prescription',
    title: t.prescription.meta_title,
    description: t.prescription.meta_description,
  })
}

export default async function PrescriptionPage({ params }: PrescriptionPageProps) {
  const { locale: localeStr } = await params
  const locale = localeStr as Locale
  const t = getTranslations(locale).prescription
  // Read at build/render time on the server; the key itself never reaches the browser.
  const aiEnabled = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN)

  return (
    <>
      <PageHero eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} />
      <section className="container py-12 md:py-16">
        <PrescriptionClient locale={locale} t={t} aiEnabled={aiEnabled} />
        <p className="mt-10 flex max-w-3xl items-start gap-2 text-xs leading-relaxed text-muted">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          {t.disclaimer}
        </p>
      </section>
    </>
  )
}
