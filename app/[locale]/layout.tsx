import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'
import Analytics from '@/components/Analytics'
import { getTranslations, type Locale } from '@/data/translations'
import { isValidLocale, locales } from '@/lib/utils'
import { fontSans, fontSerif } from '@/lib/fonts'
import { site } from '@/lib/site'
import { jsonLd, localBusinessJsonLd } from '@/lib/seo'
import '../globals.css'

interface LocaleLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export const viewport: Viewport = {
  themeColor: '#FAF8F4',
  width: 'device-width',
  initialScale: 1,
}

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params
  const t = getTranslations(locale)
  return {
    metadataBase: new URL(site.url),
    title: { default: t.meta.home_title, template: `%s · ${site.name}` },
    description: t.meta.home_description,
    applicationName: site.name,
    formatDetection: { telephone: false, address: false, email: false },
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: '32x32' },
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      ],
      apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
    },
    manifest: '/manifest.webmanifest',
  }
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale: localeStr } = await params
  if (!isValidLocale(localeStr)) notFound()

  const locale: Locale = localeStr
  const t = getTranslations(locale)

  return (
    <html lang={locale} className={`${fontSans.variable} ${fontSerif.variable}`}>
      <body>
        {/* Scroll-reveal content starts hidden; keep it visible when JavaScript is off. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLd(localBusinessJsonLd(locale, t.meta.home_description))}
        />
        <Header
          locale={locale}
          nav={t.nav}
          tray={t.tray}
          prescriptionLabel={t.prescription.nav}
          whatsappLabel={t.common.whatsapp}
          whatsappMessage={t.common.whatsapp_hello}
        />
        <main id="main" className="min-h-[70vh]">
          {children}
        </main>
        <Footer locale={locale} t={t} />
        <WhatsAppButton label={t.hero.cta_primary} message={t.common.whatsapp_hello} />
        <Analytics />
      </body>
    </html>
  )
}
