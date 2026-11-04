import 'server-only'
import { cache } from 'react'
import { getSupabase } from '@/lib/supabase'
import type { Product } from '@/data/products'
import type { ProductInput } from '@/lib/validation'
import seedProducts from '@/data/products.json'

// Preview mode: serve the read-only seed catalogue instead of Supabase (e.g. local dev or while
// the database is unavailable). Admin writes are disabled in this mode.
const useSeed = process.env.USE_SEED_DATA === 'true'

// IDs are numeric strings (legacy '1'..'10', new ones Date.now()). Sort numerically,
// newest first — a text column ordered by Postgres would give '1','10','2',...
const byNewest = (a: Product, b: Product) => Number(b.id) - Number(a.id)

export const readProducts = cache(async (): Promise<Product[]> => {
  if (useSeed) return [...(seedProducts as Product[])].sort(byNewest)
  const { data, error } = await getSupabase().from('products').select('*')
  if (error) throw new Error(error.message)
  return ((data ?? []) as Product[]).sort(byNewest)
})

export const getFeaturedProducts = cache(async (): Promise<Product[]> => {
  if (useSeed) return (await readProducts()).filter((p) => p.is_featured)
  const { data, error } = await getSupabase()
    .from('products')
    .select('*')
    .eq('is_featured', true)
  if (error) throw new Error(error.message)
  return ((data ?? []) as Product[]).sort(byNewest)
})

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  if (useSeed) return (await readProducts()).find((p) => p.slug === slug) ?? null
  const { data, error } = await getSupabase()
    .from('products')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  // A real DB error must surface (error boundary), not masquerade as a 404.
  if (error) throw new Error(error.message)
  return (data as Product | null) ?? null
})

export const getProductById = cache(async (id: string): Promise<Product | null> => {
  if (useSeed) return (await readProducts()).find((p) => p.id === id) ?? null
  const { data, error } = await getSupabase()
    .from('products')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data as Product | null) ?? null
})

export const getRelatedProducts = cache(async (product: Product, limit = 3) => {
  const all = await readProducts()
  return all
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, limit)
})

export const getAllBrands = (products: Product[]): string[] =>
  [...new Set(products.map((p) => p.brand))].sort((a, b) => a.localeCompare(b))

function assertWritable() {
  if (useSeed) throw new Error('Lecture seule : USE_SEED_DATA=true (base de données désactivée).')
}

// Databases created before the try-on feature lack these columns until supabase/schema.sql is
// re-run. Retry without them instead of failing every product save.
const NEW_COLUMNS = ['frame_shape', 'tryon_image'] as const
const isMissingNewColumn = (message: string) => NEW_COLUMNS.some((c) => message.includes(c))
function withoutNewColumns(row: Record<string, unknown>) {
  console.warn('products table lacks frame_shape/tryon_image columns — run supabase/schema.sql')
  const copy = { ...row }
  for (const c of NEW_COLUMNS) delete copy[c]
  return copy
}

export async function insertProduct(product: ProductInput): Promise<Product> {
  assertWritable()
  const row = { ...product, id: String(Date.now()), currency: 'TND' }
  const products = () => getSupabase().from('products')
  let { data, error } = await products().insert(row).select().single()
  if (error && isMissingNewColumn(error.message)) {
    ;({ data, error } = await products().insert(withoutNewColumns(row)).select().single())
  }
  if (error) throw new Error(error.message)
  return data as Product
}

export async function updateProduct(id: string, product: ProductInput): Promise<Product | null> {
  assertWritable()
  const row = { ...product, currency: 'TND' }
  const products = () => getSupabase().from('products')
  let { data, error } = await products().update(row).eq('id', id).select().maybeSingle()
  if (error && isMissingNewColumn(error.message)) {
    ;({ data, error } = await products().update(withoutNewColumns(row)).eq('id', id).select().maybeSingle())
  }
  if (error) throw new Error(error.message)
  return (data as Product | null) ?? null
}

export async function deleteProduct(id: string): Promise<void> {
  assertWritable()
  const { error } = await getSupabase().from('products').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
