import Link from 'next/link'
import { requireAdmin } from '@/lib/auth-server'
import { Plus } from 'lucide-react'
import type { Metadata } from 'next'
import { readProducts } from '@/lib/products-server'
import ProductList from '@/components/admin/ProductList'
import AdminHeader from '@/components/admin/AdminHeader'
import { buttonClass } from '@/components/ui/button'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Produits' }

export default async function AdminPage() {
  await requireAdmin()
  const products = await readProducts()

  return (
    <>
      <AdminHeader active="products" />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-ink">
            Produits <span className="text-base font-normal text-muted">({products.length})</span>
          </h1>
          <Link href="/admin/products/new" className={buttonClass({ size: 'sm' })}>
            <Plus size={16} aria-hidden="true" /> Ajouter un produit
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-soft">
          <ProductList products={products} />
        </div>
      </main>
    </>
  )
}
