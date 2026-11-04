import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BadgePercent, Glasses, MapPin, UserRoundCheck } from 'lucide-react'
import type { Metadata } from 'next'
import HeroSection from '@/components/HeroSection'
import ProductCard from '@/components/ProductCard'
import VisitSection from '@/components/VisitSection'
import ToolsSection from '@/components/ToolsSection'
import SectionHeading from '@/components/ui/SectionHeading'
import Reveal from '@/components/ui/Reveal'
import { buttonClass } from '@/components/ui/button'
import { getTranslations, type Locale } from '@/data/translations'
import { getFeaturedProducts } from '@/lib/products-server'
import { pageMetadata } from '@/lib/seo'

// ISR: cached and regenerated at most every 5 minutes; admin edits revalidate immediately.
export const revalidate = 300

interface HomePageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params
  const t = getTranslations(locale)
  return pageMetadata({
    locale: locale as Locale,
    path: '',
    title: t.meta.home_title,
    description: t.meta.home_description,
    absoluteTitle: true,
  })
}

const categoryImages = {
  sunglasses: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=900&q=80',
  eyeglasses: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=900&q=80',
  contact_lenses: 'https://images.unsplash.com/photo-1494869042583-f6c911f04b4c?w=900&q=80',
}

const whyIcons = [BadgePercent, UserRoundCheck, Glasses, MapPin]

export default async function HomePage({ params }: HomePageProps) {
  const { locale: localeStr } = await params
  const locale = localeStr as Locale
  const t = getTranslations(locale)
  // A catalogue outage should hide one section, not take down the home page.
  const featured = await getFeaturedProducts()
    .then((p) => p.slice(0, 6))
    .catch((err) => {
      console.error('home: featured products unavailable', err)
      return []
    })

  const categories = (['sunglasses', 'eyeglasses', 'contact_lenses'] as const).map((key) => ({
    key,
    label: t.categories[key],
    desc: t.categories[`${key}_desc`],
    alt: t.categories[`${key}_alt`],
    image: categoryImages[key],
  }))

  return (
    <>
      <HeroSection locale={locale} t={t} />

      {/* Categories */}
      <section aria-labelledby="categories" className="border-t border-line bg-surface">
        <div className="container py-20 md:py-28">
          <SectionHeading id="categories" eyebrow={t.categories.eyebrow} title={t.categories.title} subtitle={t.categories.subtitle} />
          <ul className="grid gap-5 md:grid-cols-3">
            {categories.map((cat, i) => (
              <Reveal as="li" key={cat.key} delay={i * 0.08}>
                <Link
                  href={`/${locale}/products?category=${cat.key}`}
                  className="group relative block aspect-[4/5] overflow-hidden rounded-3xl bg-sand"
                >
                  <Image
                    src={cat.image}
                    alt={cat.alt}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                    <h3 className="font-serif text-3xl">{cat.label}</h3>
                    <p className="mt-1.5 max-w-xs text-sm text-white/80">{cat.desc}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium">
                      {t.categories.browse}
                      <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section aria-labelledby="featured" className="border-t border-line bg-paper">
          <div className="container py-20 md:py-28">
            <SectionHeading
              id="featured"
              eyebrow={t.featured.eyebrow}
              title={t.featured.title}
              subtitle={t.featured.subtitle}
              action={
                <Link href={`/${locale}/products`} className={buttonClass({ variant: 'secondary', size: 'md', className: 'group' })}>
                  {t.featured.view_all}
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              }
            />
            <ul className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((product, i) => (
                <Reveal as="li" key={product.id} delay={(i % 3) * 0.06}>
                  <ProductCard product={product} locale={locale} t={t.products} tray={t.tray} />
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}

      <ToolsSection locale={locale} t={t} />

      {/* Why us */}
      <section aria-labelledby="why" className="bg-ink text-white">
        <div className="container py-20 md:py-28">
          <div className="mb-14 max-w-2xl">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-accent-soft/80">{t.why_us.eyebrow}</p>
            <h2 id="why" className="font-serif text-display-md">{t.why_us.title}</h2>
          </div>
          <ul className="grid gap-px overflow-hidden rounded-3xl bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {t.why_us.items.map((item, i) => {
              const Icon = whyIcons[i] ?? Glasses
              return (
                <Reveal as="li" key={item.title} delay={i * 0.06} className="bg-ink p-7">
                  <Icon size={22} className="text-accent-soft" aria-hidden="true" />
                  <h3 className="mt-6 text-lg font-medium">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{item.desc}</p>
                </Reveal>
              )
            })}
          </ul>
        </div>
      </section>

      <VisitSection t={t} />
    </>
  )
}
