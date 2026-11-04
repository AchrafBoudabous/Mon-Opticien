// Edge-compatible (used by middleware and route handlers).
// Session token format: `<expiresAtMs>.<hmacHex>` — signed, expiring, and not guessable.

export const SESSION_COOKIE = 'admin_session'
export const SESSION_MAX_AGE_S = 60 * 60 * 8 // 8 hours

const encoder = new TextEncoder()

function getSecret(): string | null {
  const secret = process.env.ADMIN_SECRET
  if (secret && secret.length >= 32) return secret
  if (process.env.NODE_ENV !== 'production') return secret || 'dev-only-insecure-secret-change-me!!'
  return null // fail closed in production when the secret is missing or weak
}

async function hmacHex(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const buf = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Constant-time string comparison to avoid timing attacks. */
export function safeEqual(a: string, b: string): boolean {
  const ab = encoder.encode(a)
  const bb = encoder.encode(b)
  let diff = ab.length ^ bb.length
  const len = Math.max(ab.length, bb.length)
  for (let i = 0; i < len; i++) diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0)
  return diff === 0
}

export async function createSessionToken(): Promise<string | null> {
  const secret = getSecret()
  if (!secret) return null
  const expires = String(Date.now() + SESSION_MAX_AGE_S * 1000)
  return `${expires}.${await hmacHex(`admin:${expires}`, secret)}`
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false
  const secret = getSecret()
  if (!secret) return false
  const [expires, sig] = token.split('.')
  if (!expires || !sig || !/^\d+$/.test(expires)) return false
  if (Number(expires) < Date.now()) return false
  return safeEqual(sig, await hmacHex(`admin:${expires}`, secret))
}

export function checkPassword(input: unknown): boolean {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected || typeof input !== 'string') return false
  // Refuse weak passwords in production (e.g. the old default "admin").
  if (process.env.NODE_ENV === 'production' && expected.length < 12) return false
  return safeEqual(input, expected)
}
