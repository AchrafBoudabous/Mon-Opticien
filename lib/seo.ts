import type { Metadata } from 'next'
import type { Locale } from '@/data/translations'
import { site } from '@/lib/site'
import { locales } from '@/lib/utils'

const ogLocale: Record<Locale, string> = { fr: 'fr_TN', en: 'en_US' }

interface PageMetaInput {
  locale: Locale
  /** Path after the locale, starting with '/' ('' for the home page). */
  path: string
  title: string
  description: string
  /** Absolute title (skips the "· Mon Opticien" template). */
  absoluteTitle?: boolean
  images?: { url: string; alt: string }[]
  noIndex?: boolean
}

export function pageMetadata({
  locale,
  path,
  title,
  description,
  absoluteTitle,
  images,
  noIndex,
}: PageMetaInput): Metadata {
  const url = `/${locale}${path}`
  const languages = Object.fromEntries(locales.map((l) => [l, `/${l}${path}`]))
  // A page-level `openGraph` object replaces the inherited file-based image, so reference the
  // generated card (app/[locale]/opengraph-image.tsx) explicitly when no image is given.
  const ogImages = images ?? [
    { url: `/${locale}/opengraph-image`, width: 1200, height: 630, alt: `${site.name} — Montplaisir, Tunis` },
  ]

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: url,
      languages: { ...languages, 'x-default': `/fr${path}` },
    },
    openGraph: {
      type: 'website',
      siteName: site.name,
      title,
      description,
      url,
      locale: ogLocale[locale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => ogLocale[l]),
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImages.map((i) => i.url),
    },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
  }
}

/** Trim a description to a SERP-friendly length on a word boundary. */
export function clampDescription(text: string, max = 158): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max - 1)
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`
}

export function localBusinessJsonLd(locale: Locale, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Optician',
    '@id': `${site.url}/#business`,
    name: site.name,
    description,
    url: `${site.url}/${locale}`,
    image: `${site.url}/${locale}/opengraph-image`,
    logo: `${site.url}/icon-512.png`,
    telephone: site.phone.replace(/\s/g, ''),
    email: site.email,
    priceRange: '$$',
    currenciesAccepted: 'TND',
    paymentAccepted: 'Cash',
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      addressLocality: `${site.address.locality}, ${site.address.city}`,
      addressCountry: site.address.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: site.geo.lat, longitude: site.geo.lng },
    hasMap: site.mapsUrl,
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: site.openingHours.opens,
        closes: site.openingHours.closes,
      },
    ],
    sameAs: Object.values(site.social).filter(Boolean),
  }
}

/** Serialise JSON-LD safely for a <script> tag (prevents `</script>` breakout). */
export const jsonLd = (data: unknown) => ({
  __html: JSON.stringify(data).replace(/</g, '\\u003c'),
})
