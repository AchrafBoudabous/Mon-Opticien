import type { ReactNode } from 'react'

interface PageHeroProps {
  eyebrow: string
  title: string
  subtitle?: string
  /** Primary CTA row — keeps a call-to-action above the fold on every inner page. */
  actions?: ReactNode
}

export default function PageHero({ eyebrow, title, subtitle, actions }: PageHeroProps) {
  return (
    <section className="border-b hairline bg-paper">
      <div className="container pb-12 pt-28 md:pb-16 md:pt-36">
        <p className="eyebrow mb-4 animate-fade-up">{eyebrow}</p>
        <h1 className="max-w-3xl animate-fade-up font-serif text-display-lg text-ink [animation-delay:60ms]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-4 max-w-xl animate-fade-up text-base text-muted [animation-delay:120ms] md:text-lg">
            {subtitle}
          </p>
        )}
        {actions && (
          <div className="mt-8 flex animate-fade-up flex-wrap gap-3 [animation-delay:180ms]">{actions}</div>
        )}
      </div>
    </section>
  )
}
