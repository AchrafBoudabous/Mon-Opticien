import Link from 'next/link'
import { ArrowRight, FileText, ScanFace, ShoppingBag } from 'lucide-react'
import type { Locale, Translations } from '@/data/translations'
import TryOnLauncher from '@/components/tryon/TryOnLauncher'
import SectionHeading from '@/components/ui/SectionHeading'
import Reveal from '@/components/ui/Reveal'
import { buttonClass } from '@/components/ui/button'

export default function ToolsSection({ locale, t }: { locale: Locale; t: Translations }) {
  const tt = t.tools
  const card = 'flex h-full flex-col rounded-3xl border border-line bg-surface p-7'
  const icon = 'flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent-strong'

  return (
    <section aria-labelledby="tools" className="border-t border-line bg-paper">
      <div className="container py-20 md:py-28">
        <SectionHeading id="tools" eyebrow={tt.eyebrow} title={tt.title} subtitle={tt.subtitle} />
        <ul className="grid gap-5 md:grid-cols-3">
          <Reveal as="li">
            <div className={card}>
              <span className={icon}><ScanFace size={22} aria-hidden="true" /></span>
              <h3 className="mt-6 font-serif text-2xl text-ink">{tt.tryon_title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{tt.tryon_text}</p>
              <TryOnLauncher
                locale={locale}
                t={t.tryon}
                label={tt.tryon_cta}
                variant="primary"
                size="md"
                className="mt-6 self-start"
              />
            </div>
          </Reveal>
          <Reveal as="li" delay={0.08}>
            <div className={card}>
              <span className={icon}><ShoppingBag size={22} aria-hidden="true" /></span>
              <h3 className="mt-6 font-serif text-2xl text-ink">{tt.tray_title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{tt.tray_text}</p>
              <Link href={`/${locale}/products`} className={buttonClass({ variant: 'secondary', size: 'md', className: 'group mt-6 self-start' })}>
                {tt.tray_cta}
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
          <Reveal as="li" delay={0.16}>
            <div className={card}>
              <span className={icon}><FileText size={22} aria-hidden="true" /></span>
              <h3 className="mt-6 font-serif text-2xl text-ink">{tt.rx_title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{tt.rx_text}</p>
              <Link href={`/${locale}/prescription`} className={buttonClass({ variant: 'secondary', size: 'md', className: 'group mt-6 self-start' })}>
                {tt.rx_cta}
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
        </ul>
      </div>
    </section>
  )
}
