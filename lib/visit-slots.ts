// Fitting-visit time slots. Shared by the browser (to offer slots) and the server (to validate
// them), so both always agree. Tunisia is UTC+1 all year (no DST since 2009), so a fixed
// offset is exact and avoids depending on the client's time zone.

export const SHOP_UTC_OFFSET_MIN = 60
const OFFSET = '+01:00'
const OPEN_HOUR = 9
const CLOSE_HOUR = 19 // last slot starts 30 min before closing
const SLOT_MIN = 30
const OPEN_WEEKDAYS = [1, 2, 3, 4, 5, 6] // Mon–Sat (0 = Sunday)
export const MIN_LEAD_MS = 60 * 60 * 1000 // at least 1 h ahead
export const BOOKING_HORIZON_DAYS = 14

const pad = (n: number) => String(n).padStart(2, '0')

/** Shop-local wall-clock parts for an instant. */
function shopParts(date: Date) {
  const shifted = new Date(date.getTime() + SHOP_UTC_OFFSET_MIN * 60_000)
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth() + 1,
    d: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
    h: shifted.getUTCHours(),
    min: shifted.getUTCMinutes(),
  }
}

export interface VisitDay {
  /** YYYY-MM-DD in shop time. */
  date: string
  weekday: number
  slots: string[] // ISO strings with +01:00 offset, e.g. 2026-11-05T10:30:00+01:00
}

export function availableDays(now = new Date()): VisitDay[] {
  const days: VisitDay[] = []
  const earliest = now.getTime() + MIN_LEAD_MS
  for (let i = 0; i <= BOOKING_HORIZON_DAYS; i++) {
    const p = shopParts(new Date(now.getTime() + i * 86_400_000))
    if (!OPEN_WEEKDAYS.includes(p.weekday)) continue
    const date = `${p.y}-${pad(p.m)}-${pad(p.d)}`
    const slots: string[] = []
    for (let mins = OPEN_HOUR * 60; mins < CLOSE_HOUR * 60; mins += SLOT_MIN) {
      const iso = `${date}T${pad(Math.floor(mins / 60))}:${pad(mins % 60)}:00${OFFSET}`
      if (Date.parse(iso) >= earliest) slots.push(iso)
    }
    if (slots.length) days.push({ date, weekday: p.weekday, slots })
  }
  return days
}

/** Server-side check: is this an exact, bookable slot right now? */
export function isBookableSlot(iso: string, now = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00\+01:00$/.test(iso)) return false
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return false
  if (t < now.getTime() + MIN_LEAD_MS) return false
  if (t > now.getTime() + (BOOKING_HORIZON_DAYS + 1) * 86_400_000) return false
  const p = shopParts(new Date(t))
  if (!OPEN_WEEKDAYS.includes(p.weekday)) return false
  if (p.min % SLOT_MIN !== 0) return false
  const mins = p.h * 60 + p.min
  return mins >= OPEN_HOUR * 60 && mins < CLOSE_HOUR * 60
}

/** "10:30" from a slot ISO string (shop time). */
export const slotTime = (iso: string) => iso.slice(11, 16)

export function formatVisit(iso: string, locale: 'fr' | 'en'): string {
  const date = new Date(iso)
  const day = new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Africa/Tunis',
  }).format(date)
  return `${day} · ${slotTime(iso)}`
}
