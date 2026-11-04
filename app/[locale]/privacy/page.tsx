import type { Metadata } from 'next'
import PageHero from '@/components/ui/PageHero'
import { getTranslations, type Locale } from '@/data/translations'
import { pageMetadata } from '@/lib/seo'
import { site } from '@/lib/site'

interface PrivacyPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = getTranslations(locale)
  return pageMetadata({
    locale: locale as Locale,
    path: '/privacy',
    title: t.meta.privacy_title,
    description: t.meta.privacy_description,
  })
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params
  const tp = getTranslations(locale).privacy

  return (
    <>
      <PageHero eyebrow={tp.eyebrow} title={tp.title} subtitle={tp.updated} />
      <article className="container max-w-3xl py-14 md:py-20">
        <p className="text-lg leading-relaxed text-ink">{tp.intro}</p>
        <div className="prose-legal mt-12 space-y-10">
          {tp.sections.map((section, i) => (
            <section key={section.title} aria-labelledby={`privacy-${i}`}>
              <h2 id={`privacy-${i}`} className="mb-3 font-serif text-3xl text-ink">
                {section.title}
              </h2>
              <div className="space-y-3">
                {section.body.map((p) => (
                  <p key={p.slice(0, 32)}>{p}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
        <p className="mt-14 border-t border-line pt-6 text-sm text-muted">
          {site.name} · {site.address.full} ·{' '}
          <a href={`mailto:${site.email}`} className="underline underline-offset-4 hover:text-ink">
            {site.email}
          </a>
        </p>
      </article>
    </>
  )
}
