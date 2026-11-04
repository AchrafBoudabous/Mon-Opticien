import 'server-only'
import { NextResponse } from 'next/server'

/**
 * CSRF defence for state-changing requests: the browser-set Origin (or Sec-Fetch-Site) must
 * match this site. Cookies are SameSite=strict already; this also protects the public,
 * cookie-less endpoints from being driven by third-party pages.
 */
export function isSameOrigin(request: Request): boolean {
  const fetchSite = request.headers.get('sec-fetch-site')
  if (fetchSite) return fetchSite === 'same-origin'

  const origin = request.headers.get('origin')
  if (!origin) return false
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

export const forbidden = () => NextResponse.json({ error: 'Forbidden' }, { status: 403 })

export class BodyTooLargeError extends Error {}

/**
 * Reads the request body but stops as soon as it exceeds `maxBytes`, so an oversized (or
 * endless chunked) upload can't exhaust server memory. Route handlers have no built-in limit.
 */
async function readLimited(request: Request, maxBytes: number): Promise<Uint8Array<ArrayBuffer>> {
  const declared = Number(request.headers.get('content-length') ?? 0)
  if (declared > maxBytes) throw new BodyTooLargeError()
  if (!request.body) return new Uint8Array()

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel()
      throw new BodyTooLargeError()
    }
    chunks.push(value)
  }
  const out = new Uint8Array(total)
  let offset = 0
  for (const c of chunks) {
    out.set(c, offset)
    offset += c.byteLength
  }
  return out
}

/** JSON body with a size cap. Returns null for invalid JSON; throws BodyTooLargeError. */
export async function readJson(request: Request, maxBytes: number): Promise<unknown> {
  const bytes = await readLimited(request, maxBytes)
  try {
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return null
  }
}

/** multipart/form-data body with a size cap. Returns null if unparsable; throws BodyTooLargeError. */
export async function readForm(request: Request, maxBytes: number): Promise<FormData | null> {
  const bytes = await readLimited(request, maxBytes)
  const contentType = request.headers.get('content-type') ?? ''
  return new Response(bytes, { headers: { 'content-type': contentType } }).formData().catch(() => null)
}

export const payloadTooLarge = () => NextResponse.json({ error: 'too_large' }, { status: 413 })

export const tooManyRequests = (retryAfterS: number, message = 'Trop de requêtes. Réessayez plus tard.') =>
  NextResponse.json({ error: message }, { status: 429, headers: { 'Retry-After': String(retryAfterS) } })
