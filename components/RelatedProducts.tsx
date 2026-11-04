import ProductCard from '@/components/ProductCard'
import SectionHeading from '@/components/ui/SectionHeading'
import { ProductCardSkeleton } from '@/components/Skeletons'
import { getRelatedProducts } from '@/lib/products-server'
import type { Product } from '@/data/products'
import type { Locale, Translations } from '@/data/translations'

interface RelatedProductsProps {
  product: Product
  locale: Locale
  t: Translations
}

export default async function RelatedProducts({ product, locale, t }: RelatedProductsProps) {
  const related = await getRelatedProducts(product).catch(() => [])
  if (related.length === 0) return null

  return (
    <section aria-labelledby="related" className="border-t border-line bg-surface">
      <div className="container py-16 md:py-20">
        <SectionHeading id="related" title={t.product_detail.related} />
        <ul className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((p) => (
            <li key={p.id}>
              <ProductCard product={p} locale={locale} t={t.products} tray={t.tray} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function RelatedProductsSkeleton() {
  return (
    <div className="border-t border-line bg-surface" role="status" aria-busy="true">
      <div className="container py-16 md:py-20">
        <div className="skeleton mb-10 h-9 w-56 md:mb-14" />
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
