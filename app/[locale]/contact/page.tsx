import { Clock, ExternalLink, Mail, MapPin, Phone } from 'lucide-react'
import type { Metadata } from 'next'
import ContactForm from '@/components/ContactForm'
import PageHero from '@/components/ui/PageHero'
import WhatsAppCta from '@/components/ui/WhatsAppCta'
import TrackedLink from '@/components/ui/TrackedLink'
import { buttonClass } from '@/components/ui/button'
import { getTranslations, type Locale } from '@/data/translations'
import { pageMetadata } from '@/lib/seo'
import { site } from '@/lib/site'

interface ContactPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = getTranslations(locale)
  return pageMetadata({
    locale: locale as Locale,
    path: '/contact',
    title: t.meta.contact_title,
    description: t.meta.contact_description,
  })
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params
  const t = getTranslations(locale)
  const tc = t.contact

  const items = [
    { Icon: MapPin, label: tc.address_label, value: site.address.full, href: site.mapsUrl, external: true },
    { Icon: Phone, label: tc.phone_label_info, value: site.phone, href: site.phoneHref },
    { Icon: Mail, label: tc.email_label, value: site.email, href: `mailto:${site.email}` },
    { Icon: Clock, label: tc.hours_label, value: tc.hours_value },
  ]

  return (
    <>
      <PageHero
        eyebrow={tc.eyebrow}
        title={tc.title}
        subtitle={tc.subtitle}
        actions={
          <>
            <WhatsAppCta label={t.hero.cta_primary} placement="contact_hero" message={t.common.whatsapp_hello} size="md" />
            <TrackedLink href={site.phoneHref} event="phone_click" placement="contact_hero" className={buttonClass({ variant: 'secondary' })}>
              <Phone size={16} aria-hidden="true" />
              {site.phone}
            </TrackedLink>
          </>
        }
      />

      <section className="container grid gap-10 py-14 md:py-20 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <ContactForm t={tc} />

        <div className="space-y-6">
          <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
            <h2 className="font-serif text-3xl text-ink">{tc.info_title}</h2>
            <dl className="mt-6 space-y-5">
              {items.map(({ Icon, label, value, href, external }) => (
                <div key={label} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
                    <Icon size={17} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-xs uppercase tracking-[0.14em] text-muted">{label}</dt>
                    <dd className="mt-1 break-words text-sm text-ink">
                      {href ? (
                        <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="underline-offset-4 hover:underline">
                          {value}
                        </a>
                      ) : (
                        value
                      )}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          <div className="overflow-hidden rounded-3xl border border-line bg-sand">
            <iframe
              src={site.mapsEmbedUrl}
              title={tc.map_title}
              className="block aspect-[4/3] w-full grayscale-[35%]"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
            <a
              href={site.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 bg-surface px-5 py-4 text-sm text-ink transition-colors hover:bg-paper"
            >
              {tc.directions}
              <ExternalLink size={15} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
