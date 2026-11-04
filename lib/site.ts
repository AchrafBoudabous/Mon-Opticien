// Single source of truth for business details used across pages, SEO and JSON-LD.

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL
  if (explicit) return explicit.replace(/\/$/, '')
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercel) return `https://${vercel}`
  return 'http://localhost:3000'
}

export const site = {
  name: 'Mon Opticien',
  url: resolveSiteUrl(),
  phone: '+216 52 388 570',
  phoneHref: 'tel:+21652388570',
  whatsappNumber: '21652388570',
  email: 'mon.opticien@hotmail.com',
  address: {
    street: '26, Avenue Kheireddine Pacha',
    locality: 'Montplaisir',
    city: 'Tunis',
    country: 'TN',
    full: '26, Avenue Kheireddine Pacha, Montplaisir, Tunis',
  },
  geo: { lat: 36.8248, lng: 10.1899 },
  // Mon–Sat 09:00–19:00
  openingHours: { days: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'], opens: '09:00', closes: '19:00' },
  mapsUrl: 'https://maps.google.com/?q=26+Avenue+Kheireddine+Pacha+Montplaisir+Tunis',
  mapsEmbedUrl:
    'https://www.google.com/maps?q=26+Avenue+Kheireddine+Pacha,+Montplaisir,+Tunis&z=16&output=embed',
  // Leave empty to hide the icon. Set real page URLs before launch.
  social: {
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL ?? '',
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? '',
  },
} as const

export const whatsappUrl = (message?: string) =>
  `https://wa.me/${site.whatsappNumber}${message ? `?text=${encodeURIComponent(message)}` : ''}`
