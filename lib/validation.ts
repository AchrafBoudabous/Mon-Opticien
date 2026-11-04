import { z } from 'zod'
import { FRAME_SHAPES } from '@/data/products'

const text = (max: number) => z.string().trim().max(max)
// Optional text columns may be NULL in existing rows; normalise to ''.
const optionalText = (max: number) =>
  z.string().trim().max(max).nullish().transform((v) => v ?? '')
// Only hosts allowed by next.config images.remotePatterns: any other host would make
// next/image throw and take the product page down.
const ALLOWED_IMAGE_HOST = /^(images\.unsplash\.com|[a-z0-9-]+\.supabase\.co)$/
const imageUrl = z
  .url({ protocol: /^https$/ })
  .max(2048)
  .refine((u) => ALLOWED_IMAGE_HOST.test(new URL(u).hostname), "Hôte d’image non autorisé (Supabase ou Unsplash)")

// Whitelist of writable columns — anything else in the request body is dropped.
export const productInputSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug invalide (minuscules, chiffres, tirets)'),
  name_fr: text(200).min(1),
  name_en: text(200).min(1),
  description_fr: text(5000).min(1),
  description_en: text(5000).min(1),
  category: z.enum(['sunglasses', 'eyeglasses', 'contact_lenses']),
  brand: text(100).min(1),
  price: z.number().finite().min(0).max(1_000_000),
  image: imageUrl,
  gallery: z.array(imageUrl).max(12).default([]),
  gender: z.enum(['men', 'women', 'unisex']),
  frame_color: optionalText(100),
  lens_color: optionalText(100),
  frame_material: optionalText(100),
  uv_protection: z.boolean(),
  polarized: z.boolean(),
  availability: z.boolean(),
  is_featured: z.boolean(),
  frame_shape: z.enum(FRAME_SHAPES).nullish().transform((v) => v ?? null),
  tryon_image: imageUrl.nullish().or(z.literal("")).transform((v) => v || null),
})
  // Contact lenses have no frame: never keep try-on data on them.
  .transform((p) => (p.category === 'contact_lenses' ? { ...p, frame_shape: null, tryon_image: null } : p))

export type ProductInput = z.infer<typeof productInputSchema>

export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((i) => `${i.path.join('.') || 'body'}: ${i.message}`)
    .join(' · ')
}
