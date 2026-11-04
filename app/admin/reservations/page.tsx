import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth-server'
import AdminHeader from '@/components/admin/AdminHeader'
import ReservationList from '@/components/admin/ReservationList'
import { listReservations } from '@/lib/reservations-server'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Réservations' }

export default async function ReservationsPage() {
  await requireAdmin()
  let reservations: Awaited<ReturnType<typeof listReservations>> = []
  let loadError = false
  try {
    reservations = await listReservations()
  } catch (err) {
    console.error('list reservations failed', (err as Error).message)
    loadError = true
  }

  return (
    <>
      <AdminHeader active="reservations" />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="mb-1 text-lg font-semibold text-ink">Réservations d’essayage</h1>
        <p className="mb-6 text-sm text-muted">
          Les montures à préparer pour chaque visite. Les réservations de plus de 12 mois sont supprimées automatiquement.
        </p>
        {loadError ? (
          <p role="alert" className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-800">
            Impossible de charger les réservations. Vérifiez que la table <code>reservations</code> existe
            (supabase/schema.sql).
          </p>
        ) : (
          <ReservationList reservations={reservations} />
        )}
      </main>
    </>
  )
}
