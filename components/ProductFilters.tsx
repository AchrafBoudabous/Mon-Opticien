'use client'

import { RotateCcw } from 'lucide-react'
import type { Locale, Translations } from '@/data/translations'
import TryOnLauncher from '@/components/tryon/TryOnLauncher'
import { FACE_SHAPES } from '@/lib/face-shape'

export interface FilterState {
  category: string
  gender: string
  brand: string
  minPrice: string
  maxPrice: string
  polarized: string
  sort: string
  face: string
}

export const EMPTY_FILTERS: FilterState = {
  category: '',
  gender: '',
  brand: '',
  minPrice: '',
  maxPrice: '',
  polarized: '',
  sort: 'newest',
  face: '',
}

export const countActiveFilters = (f: FilterState) =>
  [f.category, f.gender, f.brand, f.minPrice, f.maxPrice, f.polarized, f.face].filter(Boolean).length

interface ProductFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  brands: string[]
  t: Translations['products']
  tryonT: Translations['tryon']
  locale: Locale
}

const fieldCls =
  'h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink transition-colors hover:border-ink/25 focus:border-ink/40 focus:outline-none focus:ring-2 focus:ring-accent/30'
const labelCls = 'mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-muted'

export default function ProductFilters({ filters, onFiltersChange, brands, t, tryonT, locale }: ProductFiltersProps) {
  const tf = t.filters
  const update = (key: keyof FilterState, value: string) => onFiltersChange({ ...filters, [key]: value })
  const active = countActiveFilters(filters)

  const categories = [
    { value: '', label: tf.all },
    { value: 'sunglasses', label: tf.sunglasses },
    { value: 'eyeglasses', label: tf.eyeglasses },
    { value: 'contact_lenses', label: tf.contact_lenses },
  ]

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-ink">
          {tf.title}
          {active > 0 && (
            <span className="ml-2 rounded-full bg-ink px-2 py-0.5 text-[11px] text-white">
              {active} {tf.active}
            </span>
          )}
        </h2>
        {active > 0 && (
          <button
            type="button"
            onClick={() => onFiltersChange({ ...EMPTY_FILTERS, sort: filters.sort })}
            className="inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-ink"
          >
            <RotateCcw size={12} aria-hidden="true" />
            {tf.reset}
          </button>
        )}
      </div>

      <fieldset>
        <legend className={labelCls}>{tf.category}</legend>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const selected = filters.category === c.value
            return (
              <button
                key={c.value || 'all'}
                type="button"
                aria-pressed={selected}
                onClick={() => update('category', c.value)}
                className={
                  selected
                    ? 'rounded-full bg-ink px-3.5 py-1.5 text-sm text-white'
                    : 'rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm text-ink-soft transition-colors hover:border-ink/30'
                }
              >
                {c.label}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="filter-face" className={labelCls}>{tryonT.filter_label}</label>
        <select id="filter-face" value={filters.face} onChange={(e) => update('face', e.target.value)} className={fieldCls}>
          <option value="">{tryonT.filter_any}</option>
          {FACE_SHAPES.map((f) => (
            <option key={f} value={f}>{tryonT.faces[f]}</option>
          ))}
        </select>
        <TryOnLauncher
          locale={locale}
          t={tryonT}
          label={tryonT.finder_button}
          variant="secondary"
          size="sm"
          className="mt-2 w-full"
        />
      </div>

      <div>
        <label htmlFor="filter-gender" className={labelCls}>{tf.gender}</label>
        <select id="filter-gender" value={filters.gender} onChange={(e) => update('gender', e.target.value)} className={fieldCls}>
          <option value="">{tf.all}</option>
          <option value="men">{tf.men}</option>
          <option value="women">{tf.women}</option>
          <option value="unisex">{tf.unisex}</option>
        </select>
      </div>

      <div>
        <label htmlFor="filter-brand" className={labelCls}>{tf.brand}</label>
        <select id="filter-brand" value={filters.brand} onChange={(e) => update('brand', e.target.value)} className={fieldCls}>
          <option value="">{tf.all_brands}</option>
          {brands.map((brand) => (
            <option key={brand} value={brand}>{brand}</option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className={labelCls}>{tf.price_range}</legend>
        <div className="flex items-center gap-2">
          <label htmlFor="filter-min" className="sr-only">{tf.min_price}</label>
          <input
            id="filter-min"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={tf.min_price}
            value={filters.minPrice}
            onChange={(e) => update('minPrice', e.target.value)}
            className={fieldCls}
          />
          <span className="text-muted" aria-hidden="true">–</span>
          <label htmlFor="filter-max" className="sr-only">{tf.max_price}</label>
          <input
            id="filter-max"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={tf.max_price}
            value={filters.maxPrice}
            onChange={(e) => update('maxPrice', e.target.value)}
            className={fieldCls}
          />
        </div>
      </fieldset>

      <div>
        <label htmlFor="filter-polarized" className={labelCls}>{tf.polarized}</label>
        <select id="filter-polarized" value={filters.polarized} onChange={(e) => update('polarized', e.target.value)} className={fieldCls}>
          <option value="">{tf.all}</option>
          <option value="yes">{tf.yes}</option>
          <option value="no">{tf.no}</option>
        </select>
      </div>
    </div>
  )
}
