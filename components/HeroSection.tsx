import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, Clock } from 'lucide-react'
import type { Locale, Translations } from '@/data/translations'
import WhatsAppCta from '@/components/ui/WhatsAppCta'
import { buttonClass } from '@/components/ui/button'

interface HeroSectionProps {
  locale: Locale
  t: Translations
}

// Above-the-fold content uses CSS animations (not JS) so it paints immediately and stays LCP-friendly.
export default function HeroSection({ locale, t }: HeroSectionProps) {
  const th = t.hero
  return (
    <section className="relative overflow-hidden bg-paper">
      <div className="container grid items-center gap-10 pb-14 pt-24 md:pt-32 lg:min-h-[min(100svh,880px)] lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-20">
        <div className="max-w-xl">
          <p className="eyebrow mb-5 animate-fade-up">{th.eyebrow}</p>
          <h1 className="animate-fade-up font-serif text-display-xl text-ink [animation-delay:60ms]">
            {th.title_a} <em className="text-accent">{th.title_b}</em>
          </h1>
          <p className="mt-6 max-w-lg animate-fade-up text-base leading-relaxed text-ink-soft [animation-delay:120ms] md:text-lg">
            {th.description}
          </p>

          <div className="mt-8 flex animate-fade-up flex-col gap-3 [animation-delay:180ms] sm:flex-row">
            <WhatsAppCta label={th.cta_primary} placement="hero" message={t.common.whatsapp_hello} />
            <Link href={`/${locale}/products`} className={buttonClass({ variant: 'secondary', size: 'lg', className: 'group' })}>
              {th.cta_secondary}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>

          <p className="mt-5 flex animate-fade-up items-center gap-2 text-sm text-muted [animation-delay:220ms]">
            <Clock size={14} aria-hidden="true" />
            {th.hours_short}
          </p>

          <ul className="mt-10 hidden animate-fade-up flex-wrap gap-x-6 gap-y-2 border-t border-line pt-6 [animation-delay:260ms] sm:flex">
            {th.trust.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-ink-soft">
                <Check size={14} className="text-accent" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative animate-fade-up [animation-delay:120ms]">
          <div className="relative aspect-[4/3] overflow-hidden rounded-4xl bg-sand shadow-lift sm:aspect-[5/4] lg:aspect-[4/5]">
            <Image
              src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1400&q=80"
              alt={th.image_alt}
              fill
              priority
              fetchPriority="high"
              className="object-cover object-[center_30%]"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div className="absolute -bottom-5 left-5 hidden rounded-2xl border border-line bg-surface/95 px-5 py-4 shadow-soft backdrop-blur md:block">
            <p className="font-serif text-2xl leading-none text-ink">Montplaisir</p>
            <p className="mt-1 text-xs text-muted">26, Av. Kheireddine Pacha · Tunis</p>
          </div>
        </div>
      </div>
    </section>
  )
}
