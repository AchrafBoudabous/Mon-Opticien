import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { isAuthenticated, unauthorized } from '@/lib/auth-server'
import { forbidden, isSameOrigin, readForm, payloadTooLarge } from '@/lib/request-guard'

const MAX_BYTES = 5 * 1024 * 1024

// Allow-list of raster formats. SVG/HTML are rejected: served from a public bucket they could
// carry script (stored XSS). The extension is derived from the type, never from the filename.
const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
}

function sniff(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png'
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to))
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp'
  if (ascii(4, 8) === 'ftyp' && /^avi[fs]$/.test(ascii(8, 12))) return 'image/avif'
  return null
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return forbidden()
  if (!(await isAuthenticated())) return unauthorized()

  let formData: FormData | null
  try {
    formData = await readForm(request, 6 * 1024 * 1024)
  } catch {
    return payloadTooLarge()
  }
  const file = formData?.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Aucun fichier reçu.' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Fichier trop volumineux (5 Mo max).' }, { status: 413 })
  }

  const bytes = new Uint8Array(await file.arrayBuffer())
  const type = sniff(bytes)
  if (!type || !ALLOWED[type]) {
    return NextResponse.json({ error: 'Format non supporté (JPEG, PNG, WebP ou AVIF).' }, { status: 415 })
  }

  const filename = `${Date.now()}-${crypto.randomUUID()}.${ALLOWED[type]}`
  const supabase = getSupabase()
  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(filename, bytes, { contentType: type, upsert: false, cacheControl: '31536000' })

  if (error) {
    console.error('upload failed', error.message)
    return NextResponse.json({ error: "Échec de l'envoi du fichier." }, { status: 500 })
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('product-images').getPublicUrl(data.path)

  return NextResponse.json({ url: publicUrl })
}
