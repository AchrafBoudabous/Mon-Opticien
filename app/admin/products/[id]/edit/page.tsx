import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth-server'
import type { Metadata } from 'next'
import { getProductById } from '@/lib/products-server'
import ProductForm from '@/components/admin/ProductForm'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Modifier le produit' }

interface EditPageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: EditPageProps) {
  await requireAdmin()
  const { id } = await params
  const product = await getProductById(id)
  if (!product) notFound()

  return <ProductForm product={product} />
}
