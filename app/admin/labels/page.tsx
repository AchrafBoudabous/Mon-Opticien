import QRCode from 'qrcode'
import { requireAdmin } from '@/lib/auth-server'
import type { Metadata } from 'next'
import AdminHeader from '@/components/admin/AdminHeader'
import PrintButton from '@/components/admin/PrintButton'
import { readProducts } from '@/lib/products-server'
import { site } from '@/lib/site'
import { formatPrice } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Étiquettes QR' }

// Printable shelf labels: each QR opens the product page (tagged ?ref=qr for analytics), where
// customers can try the frame virtually or add it to their try-on tray.
export default async function LabelsPage() {
  await requireAdmin()
  const products = await readProducts()
  const labels = await Promise.all(
    products.map(async (p) => ({
      product: p,
      // SVG generated server-side by the qrcode library from our own URL — no user input.
      svg: await QRCode.toString(`${site.url}/fr/products/${p.slug}?ref=qr`, {
        type: 'svg',
        margin: 0,
        errorCorrectionLevel: 'M',
        color: { dark: '#151412', light: '#ffffff' },
      }),
    }))
  )

  return (
    <>
      <AdminHeader active="labels" />
      <main className="mx-auto max-w-7xl px-6 py-8 print:p-0">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-lg font-semibold text-ink">Étiquettes QR</h1>
            <p className="text-sm text-muted">
              À imprimer et poser près de chaque monture. Le QR ouvre la fiche produit (essai virtuel, plateau d’essayage).
            </p>
            {site.url.startsWith('http://localhost') && (
              <p className="mt-2 text-sm text-red-700">
                Attention : NEXT_PUBLIC_SITE_URL n’est pas défini — les QR pointent vers localhost.
              </p>
            )}
          </div>
          <PrintButton />
        </div>

        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 print:grid-cols-3 print:gap-3">
          {labels.map(({ product, svg }) => (
            <li
              key={product.id}
              className="flex break-inside-avoid flex-col items-center rounded-2xl border border-line bg-white p-5 text-center print:rounded-none print:border-dashed"
            >
              <div
                className="h-28 w-28 [&>svg]:h-full [&>svg]:w-full"
                role="img"
                aria-label={`QR code — ${product.name_fr}`}
                dangerouslySetInnerHTML={{ __html: svg }}
              />
              <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-accent">{product.brand}</p>
              <p className="mt-0.5 line-clamp-2 text-sm font-medium text-ink">{product.name_fr}</p>
              <p className="mt-1 text-sm tabular-nums text-ink">{formatPrice(product.price)} TND</p>
              <p className="mt-2 text-[10px] text-muted">Scannez pour l’essayer virtuellement</p>
            </li>
          ))}
        </ul>
      </main>
    </>
  )
}
