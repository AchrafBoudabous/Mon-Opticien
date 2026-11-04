import { ImageResponse } from 'next/og'
import { getTranslations } from '@/data/translations'
import { site } from '@/lib/site'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Mon Opticien — Montplaisir, Tunis'

export function generateStaticParams() {
  return [{ locale: 'fr' }, { locale: 'en' }]
}

// Default social card for every page under /[locale] (product pages override it with their photo).
export default async function OpengraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = getTranslations(locale)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: '#FAF8F4',
          color: '#151412',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <svg width="72" height="72" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="9" fill="#151412" />
            <g fill="none" stroke="#E9D8B4" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="10.5" cy="17" r="5" />
              <circle cx="21.5" cy="17" r="5" />
              <path d="M15.5 16.2c.4-.8.9-1.2 1.5-1.2" />
              <path d="M5.5 16 4 12.5M26.5 16 28 12.5" />
            </g>
          </svg>
          <div style={{ fontSize: 40, display: 'flex' }}>{site.name}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 30, letterSpacing: 6, textTransform: 'uppercase', color: '#8A6A31', display: 'flex' }}>
            {t.hero.eyebrow}
          </div>
          <div style={{ fontSize: 92, lineHeight: 1.02, marginTop: 20, display: 'flex', flexWrap: 'wrap' }}>
            {t.hero.title_a}&nbsp;<span style={{ fontStyle: 'italic', color: '#8A6A31' }}>{t.hero.title_b}</span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: '2px solid #E6E0D5',
            paddingTop: 28,
            fontSize: 28,
            color: '#3B3833',
            fontFamily: 'sans-serif',
          }}
        >
          <span>{site.address.full}</span>
          <span>{site.phone}</span>
        </div>
      </div>
    ),
    size
  )
}
