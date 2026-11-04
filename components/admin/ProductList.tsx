'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Check, ImageOff, Star, X } from 'lucide-react'
import type { Product } from '@/data/products'
import { formatPrice } from '@/lib/utils'

const CATEGORY_LABELS: Record<string, string> = {
  sunglasses: 'Soleil',
  eyeglasses: 'Optique',
  contact_lenses: 'Lentilles',
}

export default function ProductList({ products }: { products: Product[] }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function handleDelete(id: string) {
    setDeleting(id)
    setError('')
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' }).catch(() => null)
    if (!res?.ok) {
      const data = await res?.json().catch(() => ({}))
      setError(data?.error ?? 'La suppression a échoué.')
    }
    setDeleting(null)
    setConfirmId(null)
    router.refresh()
  }

  return (
    <div className="overflow-x-auto">
      {error && (
        <p role="alert" className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-muted">
            <th scope="col" className="w-16 px-4 py-3 font-medium">Image</th>
            <th scope="col" className="px-4 py-3 font-medium">Nom (FR)</th>
            <th scope="col" className="px-4 py-3 font-medium">Marque</th>
            <th scope="col" className="px-4 py-3 font-medium">Catégorie</th>
            <th scope="col" className="px-4 py-3 font-medium">Prix</th>
            <th scope="col" className="px-4 py-3 text-center font-medium">Stock</th>
            <th scope="col" className="px-4 py-3 text-center font-medium">Vedette</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b border-line/60 transition-colors hover:bg-paper">
              <td className="px-4 py-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-sand">
                  {p.image ? (
                    <Image src={p.image} alt={`${p.name_fr} — ${p.brand}`} fill className="object-cover" sizes="40px" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-muted">
                      <ImageOff size={16} aria-label="Pas d'image" />
                    </span>
                  )}
                </div>
              </td>
              <td className="max-w-[220px] truncate px-4 py-3 font-medium text-ink">{p.name_fr}</td>
              <td className="px-4 py-3 text-ink-soft">{p.brand}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-sand px-2 py-0.5 text-xs text-ink-soft">
                  {CATEGORY_LABELS[p.category] ?? p.category}
                </span>
              </td>
              <td className="px-4 py-3 font-medium tabular-nums text-ink">{formatPrice(p.price)} TND</td>
              <td className="px-4 py-3 text-center">
                {p.availability ? (
                  <Check size={16} className="inline text-whatsapp" aria-label="En stock" />
                ) : (
                  <X size={16} className="inline text-red-600" aria-label="Rupture" />
                )}
              </td>
              <td className="px-4 py-3 text-center">
                <Star
                  size={16}
                  className={p.is_featured ? 'inline fill-accent text-accent' : 'inline text-line'}
                  aria-label={p.is_featured ? 'Vedette' : 'Non vedette'}
                />
              </td>
              <td className="px-4 py-3 text-right">
                {confirmId === p.id ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="text-xs text-muted">Supprimer ?</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      disabled={deleting === p.id}
                      className="text-xs font-medium text-red-700 hover:text-red-900 disabled:opacity-50"
                    >
                      {deleting === p.id ? '…' : 'Oui'}
                    </button>
                    <button type="button" onClick={() => setConfirmId(null)} className="text-xs text-muted hover:text-ink">
                      Non
                    </button>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-3">
                    <Link href={`/admin/products/${p.id}/edit`} className="font-medium text-ink underline-offset-4 hover:underline">
                      Modifier
                    </Link>
                    <button type="button" onClick={() => setConfirmId(p.id)} className="text-red-700 hover:text-red-900">
                      Supprimer
                    </button>
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {products.length === 0 && <p className="py-12 text-center text-muted">Aucun produit pour l&apos;instant.</p>}
    </div>
  )
}
