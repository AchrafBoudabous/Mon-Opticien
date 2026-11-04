import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import type { Translations } from '@/data/translations'
import WhatsAppCta from '@/components/ui/WhatsAppCta'
import TrackedLink from '@/components/ui/TrackedLink'
import { buttonClass } from '@/components/ui/button'
import Reveal from '@/components/ui/Reveal'
import { site } from '@/lib/site'

export default function VisitSection({ t }: { t: Translations }) {
  const items = [
    { Icon: MapPin, label: t.contact.address_label, value: site.address.full, href: site.mapsUrl, external: true },
    { Icon: Phone, label: t.contact.phone_label_info, value: site.phone, href: site.phoneHref },
    { Icon: Mail, label: t.contact.email_label, value: site.email, href: `mailto:${site.email}` },
    { Icon: Clock, label: t.contact.hours_label, value: t.contact.hours_value },
  ]

  return (
    <section aria-labelledby="visit" className="bg-paper">
      <div className="container grid gap-12 py-20 md:py-28 lg:grid-cols-2 lg:items-center">
        <Reveal>
          <p className="eyebrow mb-3">{t.visit.eyebrow}</p>
          <h2 id="visit" className="font-serif text-display-md text-ink">{t.visit.title}</h2>
          <p className="mt-3 max-w-md text-muted md:text-lg">{t.visit.subtitle}</p>

          <dl className="mt-10 grid gap-6 sm:grid-cols-2">
            {items.map(({ Icon, label, value, href, external }) => (
              <div key={label} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
                  <Icon size={16} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <dt className="text-xs uppercase tracking-[0.14em] text-muted">{label}</dt>
                  <dd className="mt-1 break-words text-sm text-ink">
                    {href ? (
                      <a
                        href={href}
                        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        className="underline-offset-4 hover:underline"
                      >
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

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <WhatsAppCta label={t.visit.whatsapp_cta} placement="visit" message={t.common.whatsapp_hello} />
            <TrackedLink
              href={site.mapsUrl}
              event="directions_click"
              placement="visit"
              external
              className={buttonClass({ variant: 'secondary', size: 'lg' })}
            >
              <MapPin size={16} aria-hidden="true" />
              {t.visit.directions_cta}
            </TrackedLink>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="overflow-hidden rounded-4xl border border-line bg-sand shadow-soft">
            <iframe
              src={site.mapsEmbedUrl}
              title={t.visit.map_title}
              className="block aspect-[4/3] w-full grayscale-[35%]"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
