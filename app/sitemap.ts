import type { MetadataRoute } from 'next'
import { readProducts } from '@/lib/products-server'
import { site } from '@/lib/site'
import { locales } from '@/lib/utils'

export const revalidate = 3600

const staticPaths: { path: string; priority: number; changeFrequency: 'daily' | 'weekly' | 'yearly' }[] = [
  { path: '', priority: 1, changeFrequency: 'weekly' },
  { path: '/products', priority: 0.9, changeFrequency: 'daily' },
  { path: '/about', priority: 0.6, changeFrequency: 'yearly' },
  { path: '/delivery', priority: 0.6, changeFrequency: 'yearly' },
  { path: '/contact', priority: 0.7, changeFrequency: 'yearly' },
  { path: '/prescription', priority: 0.7, changeFrequency: 'yearly' },
  { path: '/privacy', priority: 0.2, changeFrequency: 'yearly' },
]

// Next 15 writes image URLs into <image:loc> unescaped, so a query string like `?w=800&q=80`
// produces invalid XML. Escape them ourselves.
const xmlEscape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

function entry(path: string, extra: Omit<MetadataRoute.Sitemap[number], 'url'>): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(locales.map((l) => [l, `${site.url}/${l}${path}`]))
  return locales.map((locale) => ({
    url: `${site.url}/${locale}${path}`,
    alternates: { languages },
    ...extra,
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = staticPaths.flatMap(({ path, priority, changeFrequency }) =>
    entry(path, { priority, changeFrequency })
  )

  // Never let a DB hiccup break the sitemap — fall back to static pages only.
  let products: MetadataRoute.Sitemap = []
  try {
    products = (await readProducts()).flatMap((p) =>
      entry(`/products/${p.slug}`, {
        priority: 0.8,
        changeFrequency: 'weekly',
        images: p.image ? [xmlEscape(p.image)] : undefined,
      })
    )
  } catch (err) {
    console.error('sitemap: could not load products', err)
  }

  return [...pages, ...products]
}
