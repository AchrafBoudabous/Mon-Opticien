'use client'

import { useEffect, useMemo, useState } from 'react'
import { SearchX, SlidersHorizontal } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import ProductFilters, {
  EMPTY_FILTERS,
  countActiveFilters,
  type FilterState,
} from '@/components/ProductFilters'
import type { Product } from '@/data/products'
import type { Locale, Translations } from '@/data/translations'
import { buttonClass } from '@/components/ui/button'
import { isFaceShape, suitsFace } from '@/lib/face-shape'

interface ProductsClientProps {
  products: Product[]
  locale: Locale
  t: Translations['products']
  brands: string[]
  initialFilters: Partial<FilterState>
  trayT: Translations['tray']
  tryonT: Translations['tryon']
}

const FILTER_KEYS = Object.keys(EMPTY_FILTERS) as (keyof FilterState)[]

export default function ProductsClient({ products, locale, t, brands, initialFilters, trayT, tryonT }: ProductsClientProps) {
  const [filters, setFilters] = useState<FilterState>({ ...EMPTY_FILTERS, ...initialFilters })
  const [showFilters, setShowFilters] = useState(false)

  // Keep the URL in sync so filtered views are shareable and survive refresh / back button.
  useEffect(() => {
    const params = new URLSearchParams()
    for (const key of FILTER_KEYS) {
      const value = filters[key]
      if (value && value !== EMPTY_FILTERS[key]) params.set(key, value)
    }
    const qs = params.toString()
    const next = `${window.location.pathname}${qs ? `?${qs}` : ''}`
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(window.history.state, '', next)
    }
  }, [filters])

  const filtered = useMemo(() => {
    const min = filters.minPrice ? Number(filters.minPrice) : null
    const max = filters.maxPrice ? Number(filters.maxPrice) : null

    const result = products.filter(
      (p) =>
        (!filters.category || p.category === filters.category) &&
        (!filters.gender || p.gender === filters.gender) &&
        (!filters.brand || p.brand === filters.brand) &&
        (min === null || p.price >= min) &&
        (max === null || p.price <= max) &&
        (filters.polarized !== 'yes' || p.polarized) &&
        (filters.polarized !== 'no' || !p.polarized) &&
        (!isFaceShape(filters.face) || suitsFace(p.frame_shape, filters.face))
    )

    if (filters.sort === 'price_low') return [...result].sort((a, b) => a.price - b.price)
    if (filters.sort === 'price_high') return [...result].sort((a, b) => b.price - a.price)
    return result // server already returns newest first
  }, [products, filters])

  const active = countActiveFilters(filters)
  const countLabel = `${filtered.length} ${filtered.length === 1 ? t.showing_one : t.showing_many}`

  return (
    <div className="grid gap-10 lg:grid-cols-[260px_1fr] lg:gap-14">
      <aside aria-label={t.filters.title}>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          aria-controls="product-filters"
          className={buttonClass({ variant: 'secondary', size: 'md', className: 'w-full lg:hidden' })}
        >
          <SlidersHorizontal size={16} aria-hidden="true" />
          {showFilters ? t.filters.hide : t.filters.show}
          {active > 0 && <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] text-white">{active}</span>}
        </button>
        <div
          id="product-filters"
          className={`${showFilters ? 'mt-6 block' : 'hidden'} rounded-2xl border border-line bg-surface p-5 lg:sticky lg:top-24 lg:mt-0 lg:block lg:border-0 lg:bg-transparent lg:p-0`}
        >
          <ProductFilters filters={filters} onFiltersChange={setFilters} brands={brands} t={t} tryonT={tryonT} locale={locale} />
        </div>
      </aside>

      <div className="min-w-0">
        <div className="mb-6 flex items-center justify-between gap-4 border-b border-line pb-4">
          <p className="text-sm text-muted" role="status" aria-live="polite">
            {countLabel}
          </p>
          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="hidden text-sm text-muted sm:block">
              {t.sort.label}
            </label>
            <select
              id="sort"
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
              className="h-9 rounded-full border border-line bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              <option value="newest">{t.sort.newest}</option>
              <option value="price_low">{t.sort.price_low}</option>
              <option value="price_high">{t.sort.price_high}</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-20 text-center">
            <SearchX size={36} className="mb-4 text-muted" aria-hidden="true" />
            <p className="text-ink">{t.no_results}</p>
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className={buttonClass({ variant: 'secondary', size: 'sm', className: 'mt-5' })}
            >
              {t.filters.reset}
            </button>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((product, i) => (
              <li key={product.id}>
                <ProductCard product={product} locale={locale} t={t} tray={trayT} priority={i < 3} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
