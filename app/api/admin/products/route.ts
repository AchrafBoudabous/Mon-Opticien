import { NextResponse } from 'next/server'
import { readProducts, insertProduct } from '@/lib/products-server'
import { isAuthenticated, unauthorized } from '@/lib/auth-server'
import { formatZodError, productInputSchema } from '@/lib/validation'
import { revalidateCatalogue } from '@/lib/revalidate'
import { forbidden, isSameOrigin, readJson, payloadTooLarge } from '@/lib/request-guard'

export async function GET() {
  if (!(await isAuthenticated())) return unauthorized()
  return NextResponse.json(await readProducts())
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return forbidden()
  if (!(await isAuthenticated())) return unauthorized()

  let raw: unknown
  try {
    raw = await readJson(request, 64_000)
  } catch {
    return payloadTooLarge()
  }
  const parsed = productInputSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
  }

  try {
    const product = await insertProduct(parsed.data)
    revalidateCatalogue()
    return NextResponse.json(product, { status: 201 })
  } catch (err) {
    const message = (err as Error).message
    const duplicate = /duplicate|unique/i.test(message)
    console.error('create product failed', message)
    return NextResponse.json(
      { error: duplicate ? 'Ce slug est déjà utilisé.' : 'Impossible de créer le produit.' },
      { status: duplicate ? 409 : 500 }
    )
  }
}
