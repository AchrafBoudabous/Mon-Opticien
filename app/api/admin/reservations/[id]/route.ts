import { NextResponse } from 'next/server'
import { z } from 'zod'
import { isAuthenticated, unauthorized } from '@/lib/auth-server'
import { forbidden, isSameOrigin, readJson, payloadTooLarge } from '@/lib/request-guard'
import { deleteReservation, RESERVATION_STATUSES, updateReservationStatus } from '@/lib/reservations-server'

type Ctx = { params: Promise<{ id: string }> }

const idSchema = z.uuid()
const patchSchema = z.object({ status: z.enum(RESERVATION_STATUSES) })

export async function PATCH(request: Request, { params }: Ctx) {
  if (!isSameOrigin(request)) return forbidden()
  if (!(await isAuthenticated())) return unauthorized()

  const id = idSchema.safeParse((await params).id)
  let raw: unknown
  try {
    raw = await readJson(request, 1_024)
  } catch {
    return payloadTooLarge()
  }
  const body = patchSchema.safeParse(raw)
  if (!id.success || !body.success) return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })

  try {
    const found = await updateReservationStatus(id.data, body.data.status)
    if (!found) return NextResponse.json({ error: 'Réservation introuvable.' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('update reservation failed', (err as Error).message)
    return NextResponse.json({ error: 'Impossible de modifier la réservation.' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: Ctx) {
  if (!isSameOrigin(request)) return forbidden()
  if (!(await isAuthenticated())) return unauthorized()

  const id = idSchema.safeParse((await params).id)
  if (!id.success) return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })

  try {
    await deleteReservation(id.data)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('delete reservation failed', (err as Error).message)
    return NextResponse.json({ error: 'Impossible de supprimer la réservation.' }, { status: 500 })
  }
}
