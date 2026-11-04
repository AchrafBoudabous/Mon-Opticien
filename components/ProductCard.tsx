import Image from 'next/image'
import Link from 'next/link'
import type { Product } from '@/data/products'
import type { Locale, Translations } from '@/data/translations'
import { formatPrice, getCategoryLabel } from '@/lib/utils'
import AddToTrayButton from '@/components/tray/AddToTrayButton'
import { canTryOn } from '@/data/products'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  locale: Locale
  t: Pick<Translations['products'], 'in_stock' | 'out_of_stock' | 'polarized_badge'>
  priority?: boolean
  /** When given, shows the "try in store" pill (try-on tray). */
  tray?: Translations['tray']
}

export const productAlt = (product: Product, locale: Locale) => {
  const name = locale === 'fr' ? product.name_fr : product.name_en
  return `${name} — ${product.brand}, ${getCategoryLabel(product.category, locale).toLowerCase()}`
}

export default function ProductCard({ product, locale, t, priority, tray }: ProductCardProps) {
  const name = locale === 'fr' ? product.name_fr : product.name_en

  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-sand">
        {product.image && (
          <Image
            src={product.image}
            alt={productAlt(product, locale)}
            fill
            priority={priority}
            className={cn(
              'object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]',
              !product.availability && 'opacity-70 grayscale-[30%]'
            )}
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {product.polarized && (
            <span className="rounded-full bg-surface/90 px-2.5 py-1 text-[11px] font-medium text-ink backdrop-blur">
              {t.polarized_badge}
            </span>
          )}
          {!product.availability && (
            <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-medium text-white">
              {t.out_of_stock}
            </span>
          )}
        </div>
        {tray && canTryOn(product) && product.availability && (
          <div className="absolute bottom-3 right-3">
            <AddToTrayButton
              variant="card"
              t={tray}
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
        )}
      </div>

      <div className="flex flex-1 items-start justify-between gap-4 pt-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">{product.brand}</p>
          <h3 className="mt-1 text-[15px] font-medium leading-snug text-ink">
            {/* Stretched link: the whole card is clickable, with a single focus stop. */}
            <Link
              href={`/${locale}/products/${product.slug}`}
              className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-accent focus-visible:after:ring-offset-4"
            >
              {name}
            </Link>
          </h3>
          <p className="mt-1 text-xs text-muted">{getCategoryLabel(product.category, locale)}</p>
        </div>
        <p className="shrink-0 text-[15px] font-medium tabular-nums text-ink">
          {formatPrice(product.price)} <span className="text-xs font-normal text-muted">TND</span>
        </p>
      </div>
    </article>
  )
}
