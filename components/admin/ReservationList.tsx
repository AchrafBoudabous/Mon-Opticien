'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Phone, Trash2 } from 'lucide-react'
import type { Reservation, ReservationStatus } from '@/lib/reservations-server'
import { formatVisit } from '@/lib/visit-slots'
import { formatPrice, cn } from '@/lib/utils'

const STATUS: Record<ReservationStatus, { label: string; cls: string }> = {
  new: { label: 'Nouvelle', cls: 'bg-accent-soft text-accent-strong' },
  confirmed: { label: 'Confirmée', cls: 'bg-blue-50 text-blue-800' },
  visited: { label: 'Venue', cls: 'bg-green-50 text-green-800' },
  no_show: { label: 'Absente', cls: 'bg-sand text-ink-soft' },
  cancelled: { label: 'Annulée', cls: 'bg-red-50 text-red-800' },
}

// Only digits for wa.me / tel: links (the phone was typed by the visitor).
const digits = (phone: string) => phone.replace(/[^\d+]/g, '')

export default function ReservationList({ reservations }: { reservations: Reservation[] }) {
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [showPast, setShowPast] = useState(false)

  const now = Date.now()
  const upcoming = reservations.filter((r) => Date.parse(r.visit_at) >= now - 2 * 3600_000)
  const shown = showPast ? reservations : upcoming

  async function call(id: string, init: RequestInit) {
    setPending(id)
    setError('')
    const res = await fetch(`/api/admin/reservations/${id}`, init).catch(() => null)
    if (!res?.ok) {
      const data = await res?.json().catch(() => ({}))
      setError(data?.error ?? 'L’opération a échoué.')
    }
    setPending(null)
    router.refresh()
  }

  const setStatus = (id: string, status: ReservationStatus) =>
    call(id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm text-muted">
          {upcoming.length} à venir · {reservations.length} au total
        </p>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" checked={showPast} onChange={(e) => setShowPast(e.target.checked)} className="accent-ink" />
          Afficher les visites passées
        </label>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line py-16 text-center text-muted">Aucune réservation.</p>
      ) : (
        <ul className="space-y-3">
          {shown.map((r) => (
            <li key={r.id} className={cn('rounded-2xl border border-line bg-surface p-5', pending === r.id && 'opacity-60')}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-ink first-letter:uppercase">{formatVisit(r.visit_at, 'fr')}</p>
                  <p className="mt-0.5 text-sm text-ink-soft">
                    {r.name} · <span className="font-mono text-xs tracking-wider">{r.code}</span>
                    {r.locale === 'en' && <span className="ml-2 rounded bg-sand px-1.5 text-[11px]">EN</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="sr-only" htmlFor={`status-${r.id}`}>Statut</label>
                  <select
                    id={`status-${r.id}`}
                    value={r.status}
                    disabled={pending === r.id}
                    onChange={(e) => setStatus(r.id, e.target.value as ReservationStatus)}
                    className={cn('h-9 rounded-full border-0 px-3 text-xs font-medium', STATUS[r.status].cls)}
                  >
                    {(Object.keys(STATUS) as ReservationStatus[]).map((s) => (
                      <option key={s} value={s}>{STATUS[s].label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={pending === r.id}
                    onClick={() => confirm('Supprimer cette réservation ?') && call(r.id, { method: 'DELETE' })}
                    aria-label={`Supprimer la réservation ${r.code}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>

              <ul className="mt-4 flex flex-wrap gap-2">
                {r.items.map((item) => (
                  <li key={item.id} className="rounded-xl bg-paper px-3 py-2 text-xs">
                    <span className="text-accent">{item.brand}</span> · {item.name}{' '}
                    <span className="tabular-nums text-muted">({formatPrice(item.price)} TND)</span>
                  </li>
                ))}
              </ul>

              {(r.note || r.phone) && (
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-soft">
                  {r.note && <p className="italic">« {r.note} »</p>}
                  {r.phone && (
                    <span className="flex items-center gap-3">
                      <a href={`tel:${digits(r.phone)}`} className="inline-flex items-center gap-1.5 hover:text-ink">
                        <Phone size={14} aria-hidden="true" /> {r.phone}
                      </a>
                      <a
                        href={`https://wa.me/${digits(r.phone).replace('+', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 hover:text-ink"
                      >
                        <MessageCircle size={14} aria-hidden="true" /> WhatsApp
                      </a>
                    </span>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
