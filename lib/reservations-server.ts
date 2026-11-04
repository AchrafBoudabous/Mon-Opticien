import 'server-only'
import { promises as fs } from 'fs'
import path from 'path'
import { getSupabase } from '@/lib/supabase'

export const RESERVATION_STATUSES = ['new', 'confirmed', 'visited', 'no_show', 'cancelled'] as const
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number]

export interface ReservationItem {
  id: string
  slug: string
  name: string
  brand: string
  price: number
}

export interface Reservation {
  id: string
  code: string
  name: string
  phone: string | null
  note: string | null
  visit_at: string
  items: ReservationItem[]
  locale: 'fr' | 'en'
  status: ReservationStatus
  created_at: string
}

export type NewReservation = Omit<Reservation, 'id' | 'code' | 'status' | 'created_at'>

const RETENTION_MS = 365 * 86_400_000 // matches the privacy policy (12 months)

// Preview mode (USE_SEED_DATA=true): reservations go to a local, git-ignored JSON file so the
// whole flow can be exercised without a database. Not for production (serverless disks are
// ephemeral) — production uses the Supabase `reservations` table (supabase/schema.sql).
const usePreviewStore = process.env.USE_SEED_DATA === 'true'
const PREVIEW_FILE = path.join(process.cwd(), '.data', 'reservations.json')

async function readPreview(): Promise<Reservation[]> {
  try {
    return JSON.parse(await fs.readFile(PREVIEW_FILE, 'utf8')) as Reservation[]
  } catch {
    return []
  }
}

async function writePreview(rows: Reservation[]) {
  await fs.mkdir(path.dirname(PREVIEW_FILE), { recursive: true })
  await fs.writeFile(PREVIEW_FILE, JSON.stringify(rows, null, 2))
}

// Unambiguous alphabet (no 0/O, 1/I/L) so codes are easy to read out over the phone.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
function newCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  return `MO-${Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')}`
}

export async function createReservation(input: NewReservation): Promise<Reservation> {
  const row = {
    ...input,
    code: newCode(),
    status: 'new' as const,
  }

  if (usePreviewStore) {
    const rows = await readPreview()
    const saved: Reservation = { ...row, id: crypto.randomUUID(), created_at: new Date().toISOString() }
    rows.push(saved)
    await writePreview(rows)
    return saved
  }

  const { data, error } = await getSupabase().from('reservations').insert(row).select().single()
  if (error) throw new Error(error.message)
  return data as Reservation
}

/** Lists reservations (soonest visit first) and purges rows past the retention period. */
export async function listReservations(): Promise<Reservation[]> {
  const cutoff = new Date(Date.now() - RETENTION_MS).toISOString()

  if (usePreviewStore) {
    const rows = (await readPreview()).filter((r) => r.created_at >= cutoff)
    await writePreview(rows)
    return rows.sort((a, b) => a.visit_at.localeCompare(b.visit_at))
  }

  const db = getSupabase()
  const purge = await db.from('reservations').delete().lt('created_at', cutoff)
  if (purge.error) console.error('reservations purge failed', purge.error.message)

  const { data, error } = await db.from('reservations').select('*').order('visit_at', { ascending: true }).limit(500)
  if (error) throw new Error(error.message)
  return (data ?? []) as Reservation[]
}

export async function updateReservationStatus(id: string, status: ReservationStatus): Promise<boolean> {
  if (usePreviewStore) {
    const rows = await readPreview()
    const row = rows.find((r) => r.id === id)
    if (!row) return false
    row.status = status
    await writePreview(rows)
    return true
  }
  const { data, error } = await getSupabase().from('reservations').update({ status }).eq('id', id).select('id')
  if (error) throw new Error(error.message)
  return (data ?? []).length > 0
}

export async function deleteReservation(id: string): Promise<void> {
  if (usePreviewStore) {
    await writePreview((await readPreview()).filter((r) => r.id !== id))
    return
  }
  const { error } = await getSupabase().from('reservations').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
