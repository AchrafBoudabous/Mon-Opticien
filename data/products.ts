// Product types. The catalogue lives in Supabase; `products.json` is only seed data
// (see scripts/seed.mjs and supabase/schema.sql).
export type Category = 'sunglasses' | 'eyeglasses' | 'contact_lenses'
export type Gender = 'men' | 'women' | 'unisex'

export const CATEGORIES: Category[] = ['sunglasses', 'eyeglasses', 'contact_lenses']

/** Frame silhouette — drives the virtual try-on overlay and face-shape recommendations. */
export const FRAME_SHAPES = ['round', 'rectangle', 'square', 'aviator', 'cat_eye', 'browline', 'wayfarer'] as const
export type FrameShape = (typeof FRAME_SHAPES)[number]

export interface Product {
  id: string
  slug: string
  name_fr: string
  name_en: string
  description_fr: string
  description_en: string
  category: Category
  brand: string
  price: number
  currency: 'TND'
  image: string
  gallery: string[]
  gender: Gender
  frame_color: string
  lens_color: string
  frame_material: string
  uv_protection: boolean
  polarized: boolean
  availability: boolean
  is_featured: boolean
  /** Optional: null for contact lenses or rows created before the try-on feature. */
  frame_shape?: FrameShape | null
  /** Optional transparent front-view PNG/WebP used by the try-on instead of the drawn overlay. */
  tryon_image?: string | null
}

export const canTryOn = (p: Pick<Product, 'category'>) => p.category !== 'contact_lenses'
