import { Banknote, Phone, Plus, Store } from 'lucide-react'
import type { Metadata } from 'next'
import PageHero from '@/components/ui/PageHero'
import WhatsAppCta from '@/components/ui/WhatsAppCta'
import TrackedLink from '@/components/ui/TrackedLink'
import Reveal from '@/components/ui/Reveal'
import { buttonClass } from '@/components/ui/button'
import { getTranslations, type Locale } from '@/data/translations'
import { jsonLd, pageMetadata } from '@/lib/seo'
import { site } from '@/lib/site'

// Previously a 'use client' page, which made per-page metadata impossible. Now fully server-rendered.

interface DeliveryPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: DeliveryPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = getTranslations(locale)
  return pageMetadata({
    locale: locale as Locale,
    path: '/delivery',
    title: t.meta.delivery_title,
    description: t.meta.delivery_description,
  })
}

export default async function DeliveryPage({ params }: DeliveryPageProps) {
  const { locale } = await params
  const t = getTranslations(locale)
  const td = t.delivery

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: td.faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(faqJsonLd)} />

      <PageHero
        eyebrow={td.eyebrow}
        title={td.title}
        subtitle={td.subtitle}
        actions={<WhatsAppCta label={td.cta_whatsapp} placement="delivery_hero" message={t.common.whatsapp_hello} size="md" />}
      />

      {/* Steps */}
      <section aria-labelledby="how" className="container py-20 md:py-24">
        <h2 id="how" className="mb-12 font-serif text-display-md text-ink">{td.how_title}</h2>
        <ol className="grid gap-5 md:grid-cols-3">
          {td.steps.map((step, i) => (
            <Reveal as="li" key={step.title} delay={i * 0.08} className="rounded-3xl border border-line bg-surface p-7">
              <span className="font-serif text-5xl text-accent">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-6 text-lg font-medium text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Options */}
      <section aria-labelledby="options" className="border-y border-line bg-surface">
        <div className="container py-20 md:py-24">
          <h2 id="options" className="mb-12 font-serif text-display-md text-ink">{td.options_title}</h2>
          <div className="grid gap-5 md:grid-cols-2">
            {[
              { Icon: Store, title: td.pickup_title, text: td.pickup_text },
              { Icon: Banknote, title: td.payment_title, text: td.payment_text },
            ].map(({ Icon, title, text }) => (
              <div key={title} className="rounded-3xl bg-paper p-7">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <h3 className="mt-6 text-lg font-medium text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ — native <details> is keyboard- and screen-reader-accessible with zero JS. */}
      <section aria-labelledby="faq" className="container max-w-3xl py-20 md:py-24">
        <h2 id="faq" className="mb-10 font-serif text-display-md text-ink">{td.faq_title}</h2>
        <div className="divide-y divide-line border-y border-line">
          {td.faq.map((item) => (
            <details key={item.q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left text-base font-medium text-ink">
                {item.q}
                <Plus size={18} className="shrink-0 text-muted transition-transform duration-300 group-open:rotate-45" aria-hidden="true" />
              </summary>
              <p className="pb-6 pr-10 text-sm leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-20 md:pb-28">
        <div className="rounded-4xl bg-ink px-6 py-14 text-center text-white md:px-12 md:py-20">
          <h2 className="font-serif text-display-md">{td.cta_title}</h2>
          <p className="mx-auto mt-3 max-w-md text-white/70">{td.cta_text}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <WhatsAppCta label={td.cta_whatsapp} placement="delivery_cta" message={t.common.whatsapp_hello} />
            <TrackedLink
              href={site.phoneHref}
              event="phone_click"
              placement="delivery_cta"
              className={buttonClass({ variant: 'outline-inverse', size: 'lg' })}
            >
              <Phone size={16} aria-hidden="true" />
              {td.cta_phone}
            </TrackedLink>
          </div>
        </div>
      </section>
    </>
  )
}
