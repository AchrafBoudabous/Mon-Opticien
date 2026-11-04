import { getTranslations, type Locale } from '@/data/translations'
import { readProducts, getAllBrands } from '@/lib/products-server'
import { pageMetadata } from '@/lib/seo'
import PageHero from '@/components/ui/PageHero'
import WhatsAppCta from '@/components/ui/WhatsAppCta'
import type { FilterState } from '@/components/ProductFilters'
import type { Metadata } from 'next'
import ProductsClient from './ProductsClient'
import { isFaceShape } from '@/lib/face-shape'

// Reads ?category=… etc. to server-render the filtered grid, so it must render per request.
export const dynamic = 'force-dynamic'

interface ProductsPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const ALLOWED: Record<keyof FilterState, (v: string) => boolean> = {
  category: (v) => ['sunglasses', 'eyeglasses', 'contact_lenses'].includes(v),
  gender: (v) => ['men', 'women', 'unisex'].includes(v),
  brand: (v) => v.length <= 100,
  minPrice: (v) => /^\d{1,7}$/.test(v),
  maxPrice: (v) => /^\d{1,7}$/.test(v),
  polarized: (v) => v === 'yes' || v === 'no',
  sort: (v) => ['newest', 'price_low', 'price_high'].includes(v),
  face: (v) => isFaceShape(v),
}

export async function generateMetadata({ params }: ProductsPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = getTranslations(locale)
  return pageMetadata({
    locale: locale as Locale,
    path: '/products',
    title: t.meta.products_title,
    description: t.meta.products_description,
  })
}

export default async function ProductsPage({ params, searchParams }: ProductsPageProps) {
  const { locale: localeStr } = await params
  const locale = localeStr as Locale
  const t = getTranslations(locale)
  const [products, sp] = await Promise.all([readProducts(), searchParams])

  const initialFilters: Partial<FilterState> = {}
  for (const [key, check] of Object.entries(ALLOWED) as [keyof FilterState, (v: string) => boolean][]) {
    const raw = sp[key]
    const value = Array.isArray(raw) ? raw[0] : raw
    if (value && check(value)) initialFilters[key] = value
  }

  return (
    <>
      <PageHero
        eyebrow={t.products.eyebrow}
        title={t.products.title}
        subtitle={t.products.subtitle}
        actions={<WhatsAppCta label={t.hero.cta_primary} placement="products_hero" message={t.common.whatsapp_hello} size="md" />}
      />
      <section className="container py-12 md:py-16">
        <ProductsClient
          // Re-mount when navigating to a different filtered URL (e.g. a category link).
          key={JSON.stringify(initialFilters)}
          products={products}
          locale={locale}
          t={t.products}
          brands={getAllBrands(products)}
          initialFilters={initialFilters}
          trayT={t.tray}
          tryonT={t.tryon}
        />
      </section>
    </>
  )
}
