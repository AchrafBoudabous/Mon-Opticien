import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth-server'
import ProductForm from '@/components/admin/ProductForm'

export const metadata: Metadata = { title: 'Nouveau produit' }

export default async function NewProductPage() {
  await requireAdmin()
  return <ProductForm />
}
