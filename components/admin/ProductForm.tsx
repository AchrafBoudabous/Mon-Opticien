'use client'

import { useState, useRef, type FormEvent, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { FRAME_SHAPES, type Product, type Category, type Gender, type FrameShape } from '@/data/products'

type FormState = Omit<Product, 'id' | 'currency'>

const EMPTY: FormState = {
  slug: '',
  name_fr: '',
  name_en: '',
  description_fr: '',
  description_en: '',
  category: 'sunglasses',
  brand: '',
  price: 0,
  image: '',
  gallery: [],
  gender: 'unisex',
  frame_color: '',
  lens_color: '',
  frame_material: '',
  uv_protection: false,
  polarized: false,
  availability: true,
  is_featured: false,
  frame_shape: null,
  tryon_image: null,
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

interface ProductFormProps {
  product?: Product
}

export default function ProductForm({ product }: ProductFormProps) {
  const router = useRouter()
  const isEdit = !!product

  const [form, setForm] = useState<FormState>(
    product
      ? {
          slug: product.slug,
          name_fr: product.name_fr,
          name_en: product.name_en,
          description_fr: product.description_fr,
          description_en: product.description_en,
          category: product.category,
          brand: product.brand,
          price: product.price,
          image: product.image,
          gallery: product.gallery ?? [],
          gender: product.gender,
          frame_color: product.frame_color ?? '',
          lens_color: product.lens_color ?? '',
          frame_material: product.frame_material ?? '',
          uv_protection: product.uv_protection,
          polarized: product.polarized,
          availability: product.availability,
          is_featured: product.is_featured,
          frame_shape: product.frame_shape ?? null,
          tryon_image: product.tryon_image ?? null,
        }
      : EMPTY
  )
  const [galleryText, setGalleryText] = useState(
    product ? (product.gallery ?? []).join('\n') : ''
  )
  const [slugEdited, setSlugEdited] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url')
  const [uploading, setUploading] = useState(false)
  const mainFileRef = useRef<HTMLInputElement>(null)
  const galleryFileRef = useRef<HTMLInputElement>(null)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function uploadFile(file: File): Promise<string> {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error ?? 'Échec de l’envoi')
    return data.url as string
  }

  async function handleMainFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadFile(file)
      set('image', url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de l’envoi')
    } finally {
      setUploading(false)
    }
  }

  async function handleGalleryFilesChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    try {
      const urls = await Promise.all(files.map(uploadFile))
      setGalleryText((prev) => {
        const existing = prev.trim()
        return existing ? existing + '\n' + urls.join('\n') : urls.join('\n')
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de l’envoi')
    } finally {
      setUploading(false)
      if (galleryFileRef.current) galleryFileRef.current.value = ''
    }
  }

  function handleNameFrChange(e: ChangeEvent<HTMLInputElement>) {
    set('name_fr', e.target.value)
    if (!slugEdited) {
      set('slug', generateSlug(e.target.value))
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload: Omit<Product, 'currency'> = {
      ...form,
      id: product?.id ?? '',
      gallery: galleryText
        .split('\n')
        .map((u) => u.trim())
        .filter(Boolean),
    }

    const url = isEdit ? `/api/admin/products/${product!.id}` : '/api/admin/products'
    const method = isEdit ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => null)

    if (!res) {
      setError('Connexion impossible. Vérifiez votre réseau.')
      setSaving(false)
      return
    }
    if (res.ok) {
      router.push('/admin')
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Une erreur est survenue.')
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push('/admin')}
          className="text-gray-500 hover:text-gray-900 text-sm flex items-center gap-1.5 transition-colors"
        >
          &larr; Retour
        </button>
        <h1 className="text-xl font-semibold text-gray-900">
          {isEdit ? `Modifier : ${product!.name_fr}` : 'Nouveau produit'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations générales */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5">
            Informations générales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field htmlFor="pf-name_fr" label="Nom (FR)" required>
              <input
                type="text"
                id="pf-name_fr"
                value={form.name_fr}
                onChange={handleNameFrChange}
                className={inputCls}
                required
              />
            </Field>
            <Field htmlFor="pf-name_en" label="Nom (EN)" required>
              <input
                type="text"
                id="pf-name_en"
                value={form.name_en}
                onChange={(e) => set('name_en', e.target.value)}
                className={inputCls}
                required
              />
            </Field>
            <Field htmlFor="pf-brand" label="Marque" required>
              <input
                type="text"
                id="pf-brand"
                value={form.brand}
                onChange={(e) => set('brand', e.target.value)}
                className={inputCls}
                required
              />
            </Field>
            <Field htmlFor="pf-category" label="Catégorie" required>
              <select
                id="pf-category"
                value={form.category}
                onChange={(e) => set('category', e.target.value as Category)}
                className={inputCls}
              >
                <option value="sunglasses">Lunettes de soleil</option>
                <option value="eyeglasses">Lunettes optiques</option>
                <option value="contact_lenses">Lentilles de contact</option>
              </select>
            </Field>
            <Field htmlFor="pf-price" label="Prix (TND)" required>
              <input
                type="number"
                min={0}
                step={0.01}
                id="pf-price"
                value={form.price}
                onChange={(e) => set('price', parseFloat(e.target.value) || 0)}
                className={inputCls}
                required
              />
            </Field>
            <Field htmlFor="pf-gender" label="Genre" required>
              <select
                id="pf-gender"
                value={form.gender}
                onChange={(e) => set('gender', e.target.value as Gender)}
                className={inputCls}
              >
                <option value="unisex">Unisexe</option>
                <option value="men">Homme</option>
                <option value="women">Femme</option>
              </select>
            </Field>
            <Field htmlFor="pf-slug" label="Slug (URL)" required className="md:col-span-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  id="pf-slug"
                  value={form.slug}
                  onChange={(e) => { set('slug', e.target.value); setSlugEdited(true) }}
                  className={inputCls + ' flex-1'}
                  required
                  pattern="[a-z0-9-]+"
                  title="Minuscules, chiffres et tirets uniquement"
                />
                {!isEdit && (
                  <button
                    type="button"
                    onClick={() => { set('slug', generateSlug(form.name_fr)); setSlugEdited(false) }}
                    className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Générer
                  </button>
                )}
              </div>
            </Field>
          </div>
        </section>

        {/* Descriptions */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5">
            Descriptions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field htmlFor="pf-description_fr" label="Description (FR)" required>
              <textarea
                id="pf-description_fr"
                value={form.description_fr}
                onChange={(e) => set('description_fr', e.target.value)}
                className={inputCls + ' h-32 resize-none'}
                required
              />
            </Field>
            <Field htmlFor="pf-description_en" label="Description (EN)" required>
              <textarea
                id="pf-description_en"
                value={form.description_en}
                onChange={(e) => set('description_en', e.target.value)}
                className={inputCls + ' h-32 resize-none'}
                required
              />
            </Field>
          </div>
        </section>

        {/* Images */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5">
            Images
          </h2>
          <div className="space-y-4">
            {/* Main image */}
            <Field htmlFor="pf-image" label="Image principale" required>
              <div className="flex gap-1 mb-2">
                {(['url', 'upload'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setImageMode(mode)}
                    className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                      imageMode === mode
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {mode === 'url' ? 'URL' : 'Téléverser un fichier'}
                  </button>
                ))}
              </div>
              {imageMode === 'url' ? (
                <input
                  type="url"
                  id="pf-image"
                  value={form.image}
                  onChange={(e) => set('image', e.target.value)}
                  className={inputCls}
                  placeholder="https://..."
                  required={!form.image}
                />
              ) : (
                <div className="flex items-center gap-3">
                  <input
                    ref={mainFileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    onChange={handleMainFileChange}
                    className="text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                    disabled={uploading}
                  />
                  {uploading && <span className="text-xs text-gray-400">Envoi…</span>}
                </div>
              )}
            </Field>
            {form.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.image}
                alt="Aperçu de l’image principale"
                className="h-24 w-24 object-cover rounded-xl border border-gray-100"
              />
            )}

            {/* Gallery */}
            <Field htmlFor="pf-gallery" label="Galerie">
              <textarea
                id="pf-gallery"
                value={galleryText}
                onChange={(e) => setGalleryText(e.target.value)}
                className={inputCls + ' h-24 resize-none font-mono text-xs'}
                placeholder={'https://...\nhttps://...'}
              />
              <div className="mt-2 flex items-center gap-3">
                <label className={`cursor-pointer px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  + Ajouter des fichiers
                  <input
                    ref={galleryFileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    multiple
                    onChange={handleGalleryFilesChange}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                {uploading && <span className="text-xs text-gray-400">Envoi…</span>}
              </div>
            </Field>
          </div>
        </section>

        {/* Détails techniques */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5">
            Détails techniques
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field htmlFor="pf-frame_color" label="Couleur monture">
              <input
                type="text"
                id="pf-frame_color"
                value={form.frame_color}
                onChange={(e) => set('frame_color', e.target.value)}
                className={inputCls}
                placeholder="Noir / Black"
              />
            </Field>
            <Field htmlFor="pf-lens_color" label="Couleur verres">
              <input
                type="text"
                id="pf-lens_color"
                value={form.lens_color}
                onChange={(e) => set('lens_color', e.target.value)}
                className={inputCls}
                placeholder="Gris / Grey"
              />
            </Field>
            <Field htmlFor="pf-frame_material" label="Matière monture">
              <input
                type="text"
                id="pf-frame_material"
                value={form.frame_material}
                onChange={(e) => set('frame_material', e.target.value)}
                className={inputCls}
                placeholder="Metal / Metal"
              />
            </Field>
          </div>
        </section>

        {/* Essai virtuel */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Essai virtuel
          </h2>
          <p className="mb-5 text-xs text-gray-500">
            La forme permet l’essai virtuel et les conseils « forme du visage ». Sans image dédiée, une monture est dessinée
            automatiquement à partir de la forme et des couleurs.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field htmlFor="pf-frame_shape" label="Forme de la monture">
              <select
                id="pf-frame_shape"
                value={form.frame_shape ?? ''}
                onChange={(e) => set('frame_shape', (e.target.value || null) as FrameShape | null)}
                className={inputCls}
                disabled={form.category === 'contact_lenses'}
              >
                <option value="">— Aucune (pas d’essai virtuel)</option>
                {FRAME_SHAPES.map((shape) => (
                  <option key={shape} value={shape}>{FRAME_SHAPE_LABELS[shape]}</option>
                ))}
              </select>
            </Field>
            <Field htmlFor="pf-tryon_image" label="Image d’essai (facultatif)">
              <input
                type="url"
                id="pf-tryon_image"
                value={form.tryon_image ?? ''}
                onChange={(e) => set('tryon_image', e.target.value || null)}
                className={inputCls}
                placeholder="https://… (PNG transparent, vue de face)"
              />
              <div className="mt-2 flex items-center gap-3">
                <label className={`cursor-pointer px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  Téléverser un PNG
                  <input
                    type="file"
                    accept="image/png,image/webp"
                    className="hidden"
                    disabled={uploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      e.target.value = ''
                      if (!file) return
                      setUploading(true)
                      try {
                        set('tryon_image', await uploadFile(file))
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'Échec de l’envoi')
                      } finally {
                        setUploading(false)
                      }
                    }}
                  />
                </label>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Format 900 × 360 px, fond transparent, centres des verres à 27,8 % et 72,2 % de la largeur.
              </p>
            </Field>
          </div>
        </section>

        {/* Statut */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5">
            Statut &amp; options
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(
              [
                ['availability', 'En stock'],
                ['is_featured', 'Produit vedette'],
                ['uv_protection', 'Protection UV'],
                ['polarized', 'Polarisé'],
              ] as [keyof FormState, string][]
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[key] as boolean}
                  onChange={(e) => set(key, e.target.checked)}
                  className="w-4 h-4 rounded accent-gray-900"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Actions */}
        {error && (
          <p className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {error}
          </p>
        )}
        <div className="flex items-center justify-end gap-3 pb-4">
          <button
            type="button"
            onClick={() => router.push('/admin')}
            className="px-5 py-2.5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 text-sm bg-gray-900 text-white rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer les modifications' : 'Créer le produit'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  htmlFor,
  required,
  className,
  children,
}: {
  label: string
  htmlFor?: string
  required?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const FRAME_SHAPE_LABELS: Record<FrameShape, string> = {
  round: 'Ronde',
  rectangle: 'Rectangulaire',
  square: 'Carrée',
  aviator: 'Aviateur',
  cat_eye: 'Papillon (cat-eye)',
  browline: 'Browline (clubmaster)',
  wayfarer: 'Wayfarer',
}

const inputCls =
  'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white'
