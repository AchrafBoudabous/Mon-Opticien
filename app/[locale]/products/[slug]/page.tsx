import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Check, ChevronRight, MapPin, Phone, X } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations, type Locale } from '@/data/translations'
import { Suspense } from 'react'
import { getProductBySlug } from '@/lib/products-server'
import { generateProductWhatsAppUrl } from '@/lib/whatsapp'
import { formatPrice, getCategoryLabel, getGenderLabel } from '@/lib/utils'
import { clampDescription, jsonLd, pageMetadata } from '@/lib/seo'
import { site } from '@/lib/site'
import ProductGallery from '@/components/ProductGallery'
import { productAlt } from '@/components/ProductCard'
import RelatedProducts, { RelatedProductsSkeleton } from '@/components/RelatedProducts'
import TryOnLauncher from '@/components/tryon/TryOnLauncher'
import AddToTrayButton from '@/components/tray/AddToTrayButton'
import QrScanTracker from '@/components/QrScanTracker'
import { canTryOn } from '@/data/products'
import TrackedLink from '@/components/ui/TrackedLink'
import { WhatsAppIcon } from '@/components/ui/icons'
import { buttonClass } from '@/components/ui/button'

export const revalidate = 300

interface ProductDetailProps {
  params: Promise<{ locale: string; slug: string }>
}

// Empty list + default dynamicParams: each product is rendered on first visit, then cached (ISR).
export function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: ProductDetailProps): Promise<Metadata> {
  const { locale: localeStr, slug } = await params
  const locale = localeStr as Locale
  const t = getTranslations(locale)
  const product = await getProductBySlug(slug)
  if (!product) return { title: t.product_detail.not_found_title, robots: { index: false } }

  const name = locale === 'fr' ? product.name_fr : product.name_en
  const description = locale === 'fr' ? product.description_fr : product.description_en
  return pageMetadata({
    locale,
    path: `/products/${product.slug}`,
    title: `${name} — ${product.brand}`,
    description: clampDescription(
      `${formatPrice(product.price)} TND · ${description || t.meta.product_fallback_description}`
    ),
    images: product.image ? [{ url: product.image, alt: productAlt(product, locale) }] : undefined,
  })
}

export default async function ProductDetailPage({ params }: ProductDetailProps) {
  const { locale: localeStr, slug } = await params
  const locale = localeStr as Locale
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const t = getTranslations(locale)
  const tp = t.product_detail
  const name = locale === 'fr' ? product.name_fr : product.name_en
  const description = locale === 'fr' ? product.description_fr : product.description_en
  const whatsappHref = generateProductWhatsAppUrl(name, product.price, locale)
  const images = [...new Set([product.image, ...(product.gallery ?? [])].filter(Boolean))]
  const url = `${site.url}/${locale}/products/${product.slug}`

  const details: { label: string; value: string | boolean }[] = [
    { label: tp.frame_color, value: product.frame_color },
    { label: tp.lens_color, value: product.lens_color },
    { label: tp.frame_material, value: product.frame_material },
    { label: tp.uv_protection, value: product.uv_protection },
    { label: tp.polarized, value: product.polarized },
    { label: tp.gender_label, value: getGenderLabel(product.gender, locale) },
  ].filter((d) => typeof d.value === 'boolean' || (d.value && d.value !== '-'))

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name,
      description,
      image: images,
      sku: product.id,
      brand: { '@type': 'Brand', name: product.brand },
      category: getCategoryLabel(product.category, locale),
      url,
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: 'TND',
        availability: product.availability ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url,
        seller: { '@id': `${site.url}/#business` },
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: tp.breadcrumb_home, item: `${site.url}/${locale}` },
        { '@type': 'ListItem', position: 2, name: t.nav.collection, item: `${site.url}/${locale}/products` },
        { '@type': 'ListItem', position: 3, name, item: url },
      ],
    },
  ]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(structuredData)} />
      <QrScanTracker slug={product.slug} />

      <div className="container pb-16 pt-24 md:pt-28">
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
            <li>
              <Link href={`/${locale}`} className="transition-colors hover:text-ink">{tp.breadcrumb_home}</Link>
            </li>
            <li aria-hidden="true"><ChevronRight size={14} /></li>
            <li>
              <Link href={`/${locale}/products`} className="transition-colors hover:text-ink">{t.nav.collection}</Link>
            </li>
            <li aria-hidden="true"><ChevronRight size={14} /></li>
            <li aria-current="page" className="max-w-[16rem] truncate text-ink">{name}</li>
          </ol>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <ProductGallery images={images} alt={productAlt(product, locale)} viewLabel={tp.gallery_view} />

          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow">{product.brand}</span>
              <span className="text-muted" aria-hidden="true">·</span>
              <Link
                href={`/${locale}/products?category=${product.category}`}
                className="text-xs text-muted underline-offset-4 hover:text-ink hover:underline"
              >
                {getCategoryLabel(product.category, locale)}
              </Link>
            </div>

            <h1 className="mt-3 font-serif text-display-md text-ink">{name}</h1>

            <div className="mt-5 flex flex-wrap items-center gap-4">
              <p className="text-3xl font-medium tabular-nums text-ink">
                {formatPrice(product.price)} <span className="text-base font-normal text-muted">TND</span>
              </p>
              <span
                className={
                  product.availability
                    ? 'inline-flex items-center gap-1.5 rounded-full bg-whatsapp/10 px-3 py-1 text-sm text-whatsapp-hover'
                    : 'inline-flex items-center gap-1.5 rounded-full bg-sand px-3 py-1 text-sm text-ink-soft'
                }
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${product.availability ? 'bg-whatsapp' : 'bg-muted'}`}
                  aria-hidden="true"
                />
                {product.availability ? tp.in_stock : tp.out_of_stock}
              </span>
            </div>

            {description && <p className="mt-6 leading-relaxed text-ink-soft">{description}</p>}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <TrackedLink
                href={whatsappHref}
                event="whatsapp_click"
                placement="product"
                external
                className={buttonClass({ variant: 'whatsapp', size: 'lg', className: 'sm:flex-1' })}
              >
                <WhatsAppIcon size={18} />
                {tp.order_whatsapp}
              </TrackedLink>
              <TrackedLink
                href={site.phoneHref}
                event="phone_click"
                placement="product"
                className={buttonClass({ variant: 'secondary', size: 'lg' })}
              >
                <Phone size={16} aria-hidden="true" />
                {tp.call}
              </TrackedLink>
            </div>
            {canTryOn(product) && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {product.frame_shape && (
                  <TryOnLauncher
                    locale={locale}
                    t={t.tryon}
                    label={t.tryon.button}
                    className="w-full"
                    product={{
                      name,
                      shape: product.frame_shape,
                      frameColor: product.frame_color ?? '',
                      lensColor: product.lens_color ?? '',
                      category: product.category,
                      tryonImage: product.tryon_image,
                    }}
                  />
                )}
                <div className={product.frame_shape ? '' : 'sm:col-span-2'}>
                  <AddToTrayButton
                    t={t.tray}
                    available={product.availability}
                    item={{
                      id: product.id,
                      slug: product.slug,
                      name_fr: product.name_fr,
                      name_en: product.name_en,
                      brand: product.brand,
                      price: product.price,
                      image: product.image,
                    }}
                  />
                </div>
              </div>
            )}
            <p className="mt-3 text-center text-xs text-muted sm:text-left">{tp.reassurance}</p>

            <section aria-labelledby="specs" className="mt-10">
              <h2 id="specs" className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-muted">
                {tp.technical_details}
              </h2>
              <dl className="divide-y divide-line border-y border-line">
                {details.map((d) => (
                  <div key={d.label} className="flex items-center justify-between gap-6 py-3 text-sm">
                    <dt className="text-muted">{d.label}</dt>
                    <dd className="text-right text-ink">
                      {typeof d.value === 'boolean' ? (
                        <span className="inline-flex items-center gap-1">
                          {d.value ? <Check size={14} aria-hidden="true" /> : <X size={14} aria-hidden="true" />}
                          {d.value ? tp.yes : tp.no}
                        </span>
                      ) : (
                        d.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <p className="mt-6 flex items-start gap-2 text-xs text-muted">
              <MapPin size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
              {site.name} — {site.address.full}
            </p>
          </div>
        </div>
      </div>

      {/* Streams in after the main content; the product itself is fetched first so a missing
          slug still returns a real HTTP 404. */}
      <Suspense fallback={<RelatedProductsSkeleton />}>
        <RelatedProducts product={product} locale={locale} t={t} />
      </Suspense>
    </>
  )
}
