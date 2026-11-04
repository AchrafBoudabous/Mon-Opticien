import Image from 'next/image'
import { Contact, Eye, Glasses, Heart, ShieldCheck, Star, Sun } from 'lucide-react'
import type { Metadata } from 'next'
import PageHero from '@/components/ui/PageHero'
import WhatsAppCta from '@/components/ui/WhatsAppCta'
import Reveal from '@/components/ui/Reveal'
import VisitSection from '@/components/VisitSection'
import { getTranslations, type Locale } from '@/data/translations'
import { pageMetadata } from '@/lib/seo'

interface AboutPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = getTranslations(locale)
  return pageMetadata({
    locale: locale as Locale,
    path: '/about',
    title: t.meta.about_title,
    description: t.meta.about_description,
  })
}

const offerIcons = [Sun, Glasses, Contact]
const valueIcons = [Star, Heart, Eye, ShieldCheck]

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params
  const t = getTranslations(locale)
  const ta = t.about

  return (
    <>
      <PageHero
        eyebrow={ta.eyebrow}
        title={ta.title}
        subtitle={ta.subtitle}
        actions={<WhatsAppCta label={t.hero.cta_primary} placement="about_hero" message={t.common.whatsapp_hello} size="md" />}
      />

      {/* Story */}
      <section aria-labelledby="story" className="container grid gap-12 py-20 md:py-28 lg:grid-cols-2 lg:items-center lg:gap-20">
        <Reveal>
          <h2 id="story" className="font-serif text-display-md text-ink">{ta.story_title}</h2>
          <div className="mt-6 space-y-4 leading-relaxed text-ink-soft">
            {ta.story.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.1} className="relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-4xl bg-sand shadow-lift">
            <Image
              src="https://images.unsplash.com/photo-1577803645773-f96470509666?w=1200&q=80"
              alt={ta.story_image_alt}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div className="absolute -bottom-6 left-6 rounded-2xl bg-ink px-6 py-5 text-white shadow-lift">
            <p className="font-serif text-4xl leading-none">{ta.brands_stat}</p>
            <p className="mt-1 text-xs text-white/70">{ta.brands_label}</p>
          </div>
        </Reveal>
      </section>

      {/* Offer */}
      <section aria-labelledby="offer" className="border-y border-line bg-surface">
        <div className="container py-20 md:py-28">
          <h2 id="offer" className="mb-12 font-serif text-display-md text-ink">{ta.offer_title}</h2>
          <ul className="grid gap-5 md:grid-cols-3">
            {ta.offers.map((offer, i) => {
              const Icon = offerIcons[i] ?? Glasses
              return (
                <Reveal as="li" key={offer.title} delay={i * 0.08} className="rounded-3xl bg-paper p-7">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <h3 className="mt-6 text-lg font-medium text-ink">{offer.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{offer.text}</p>
                </Reveal>
              )
            })}
          </ul>
        </div>
      </section>

      {/* Values */}
      <section aria-labelledby="values" className="container py-20 md:py-28">
        <h2 id="values" className="mb-12 font-serif text-display-md text-ink">{ta.values_title}</h2>
        <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {ta.values.map((value, i) => {
            const Icon = valueIcons[i] ?? Star
            return (
              <Reveal as="li" key={value.title} delay={i * 0.06} className="border-t border-ink pt-6">
                <Icon size={20} className="text-accent" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-medium text-ink">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{value.text}</p>
              </Reveal>
            )
          })}
        </ul>
      </section>

      <div className="border-t border-line">
        <VisitSection t={t} />
      </div>
    </>
  )
}
