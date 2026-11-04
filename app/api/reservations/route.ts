import { NextResponse } from 'next/server'
import { z } from 'zod'
import { readProducts } from '@/lib/products-server'
import { createReservation } from '@/lib/reservations-server'
import { isBookableSlot } from '@/lib/visit-slots'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { forbidden, isSameOrigin, tooManyRequests, readJson, payloadTooLarge } from '@/lib/request-guard'
import { canTryOn } from '@/data/products'

// Mirrors lib/tray-store MAX_TRAY_ITEMS (that module is client-only).
const MAX_TRAY_ITEMS = 5

const bodySchema = z.object({
  name: z.string().trim().min(2).max(80),
  // Optional; digits, spaces, +, -, parentheses only.
  phone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[+\d\s().-]*$/)
    .optional()
    .transform((v) => v || null),
  note: z
    .string()
    .trim()
    .max(300)
    .optional()
    .transform((v) => v || null),
  visitAt: z.string().max(40),
  productIds: z.array(z.string().max(40)).min(1).max(MAX_TRAY_ITEMS),
  locale: z.enum(['fr', 'en']),
  // Honeypot: hidden from humans, bots tend to fill every field.
  website: z.string().max(200).optional(),
})

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return forbidden()
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ error: 'Unsupported content type' }, { status: 415 })
  }

  const ip = clientIp(request)
  const burst = rateLimit(`resv:burst:${ip}`, 5, 10 * 60 * 1000)
  const daily = rateLimit(`resv:day:${ip}`, 10, 24 * 60 * 60 * 1000)
  if (!burst.ok || !daily.ok) return tooManyRequests(Math.max(burst.retryAfterS, daily.retryAfterS))

  let raw: unknown
  try {
    raw = await readJson(request, 4_096)
  } catch {
    return payloadTooLarge()
  }
  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  const body = parsed.data

  // Pretend success to bots so they don't adapt; nothing is stored.
  if (body.website) return NextResponse.json({ code: 'MO-OK' }, { status: 201 })

  if (!isBookableSlot(body.visitAt)) {
    return NextResponse.json({ error: 'slot' }, { status: 400 })
  }

  // Names and prices come from the catalogue, never from the client.
  const uniqueIds = [...new Set(body.productIds)]
  let catalogue
  try {
    catalogue = await readProducts()
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 })
  }
  const items = uniqueIds
    .map((id) => catalogue.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p && p.availability && canTryOn(p))
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      name: body.locale === 'fr' ? p.name_fr : p.name_en,
      brand: p.brand,
      price: p.price,
    }))
  if (items.length === 0) return NextResponse.json({ error: 'items' }, { status: 400 })

  try {
    const saved = await createReservation({
      name: body.name,
      phone: body.phone,
      note: body.note,
      visit_at: new Date(body.visitAt).toISOString(),
      items,
      locale: body.locale,
    })
    return NextResponse.json({ code: saved.code, items }, { status: 201 })
  } catch (err) {
    console.error('create reservation failed', (err as Error).message)
    return NextResponse.json({ error: 'unavailable' }, { status: 503 })
  }
}
