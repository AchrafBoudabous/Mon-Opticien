import { NextResponse } from 'next/server'
import { updateProduct, deleteProduct } from '@/lib/products-server'
import { isAuthenticated, unauthorized } from '@/lib/auth-server'
import { formatZodError, productInputSchema } from '@/lib/validation'
import { revalidateCatalogue } from '@/lib/revalidate'
import { forbidden, isSameOrigin, readJson, payloadTooLarge } from '@/lib/request-guard'

type Ctx = { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: Ctx) {
  if (!isSameOrigin(request)) return forbidden()
  if (!(await isAuthenticated())) return unauthorized()

  const { id } = await params
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
    const updated = await updateProduct(id, parsed.data)
    if (!updated) return NextResponse.json({ error: 'Produit introuvable.' }, { status: 404 })
    revalidateCatalogue()
    return NextResponse.json(updated)
  } catch (err) {
    const message = (err as Error).message
    const duplicate = /duplicate|unique/i.test(message)
    console.error('update product failed', message)
    return NextResponse.json(
      { error: duplicate ? 'Ce slug est déjà utilisé.' : 'Impossible de modifier le produit.' },
      { status: duplicate ? 409 : 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: Ctx) {
  if (!isSameOrigin(request)) return forbidden()
  if (!(await isAuthenticated())) return unauthorized()

  const { id } = await params
  try {
    await deleteProduct(id)
    revalidateCatalogue()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('delete product failed', (err as Error).message)
    return NextResponse.json({ error: 'Impossible de supprimer le produit.' }, { status: 500 })
  }
}
