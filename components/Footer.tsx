import Link from 'next/link'
import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import type { Locale, Translations } from '@/data/translations'
import { FacebookIcon, InstagramIcon, LogoMark } from '@/components/ui/icons'
import WhatsAppCta from '@/components/ui/WhatsAppCta'
import { site } from '@/lib/site'

interface FooterProps {
  locale: Locale
  t: Translations
}

export default function Footer({ locale, t }: FooterProps) {
  const links = [
    { href: `/${locale}`, label: t.nav.home },
    { href: `/${locale}/products`, label: t.nav.collection },
    { href: `/${locale}/about`, label: t.nav.about },
    { href: `/${locale}/delivery`, label: t.nav.delivery },
    { href: `/${locale}/prescription`, label: t.prescription.nav },
    { href: `/${locale}/contact`, label: t.nav.contact },
    { href: `/${locale}/privacy`, label: t.nav.privacy },
  ]

  const socials = [
    { href: site.social.facebook, label: 'Facebook', Icon: FacebookIcon },
    { href: site.social.instagram, label: 'Instagram', Icon: InstagramIcon },
  ].filter((s) => s.href)

  return (
    <footer className="bg-ink text-white/70">
      <div className="container py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="mb-5 flex items-center gap-2.5">
              <LogoMark size={34} className="[&>rect]:fill-white/10" />
              <span className="font-serif text-2xl text-white">{site.name}</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed">{t.footer.description}</p>
            <WhatsAppCta
              label={site.phone}
              placement="footer"
              message={t.common.whatsapp_hello}
              size="md"
              className="mt-6"
            />
            {socials.length > 0 && (
              <ul className="mt-6 flex gap-2" aria-label={t.footer.social_title}>
                {socials.map(({ href, label, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/80 transition-colors hover:border-white/40 hover:text-white"
                    >
                      <Icon />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <nav aria-labelledby="footer-nav" className="lg:col-span-2 lg:col-start-6">
            <h2 id="footer-nav" className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-white">
              {t.footer.quick_links_title}
            </h2>
            <ul className="space-y-2.5">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-3">
            <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-white">
              {t.footer.contact_title}
            </h2>
            <address className="space-y-3 text-sm not-italic">
              <a href={site.mapsUrl} target="_blank" rel="noopener noreferrer" className="flex gap-3 transition-colors hover:text-white">
                <MapPin size={16} className="mt-0.5 shrink-0 text-accent-soft/80" aria-hidden="true" />
                {site.address.full}
              </a>
              <a href={site.phoneHref} className="flex gap-3 transition-colors hover:text-white">
                <Phone size={16} className="mt-0.5 shrink-0 text-accent-soft/80" aria-hidden="true" />
                {site.phone}
              </a>
              <a href={`mailto:${site.email}`} className="flex gap-3 break-all transition-colors hover:text-white">
                <Mail size={16} className="mt-0.5 shrink-0 text-accent-soft/80" aria-hidden="true" />
                {site.email}
              </a>
            </address>
          </div>

          <div className="lg:col-span-2">
            <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-white">
              {t.footer.hours_title}
            </h2>
            <p className="flex gap-3 text-sm">
              <Clock size={16} className="mt-0.5 shrink-0 text-accent-soft/80" aria-hidden="true" />
              <span>
                {t.footer.hours_value}
                <br />
                <span className="text-white">{t.footer.hours_time}</span>
                <br />
                {t.footer.hours_closed}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-col gap-2 py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name}. {t.footer.rights}
          </p>
          <Link href={`/${locale}/privacy`} className="transition-colors hover:text-white">
            {t.nav.privacy}
          </Link>
        </div>
      </div>
    </footer>
  )
}
