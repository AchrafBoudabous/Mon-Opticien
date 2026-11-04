import 'server-only'

// Best-effort, in-memory fixed-window limiter. On serverless platforms each instance has its
// own memory, so treat this as a speed bump; use a shared store (e.g. Upstash Redis) for a hard limit.
const buckets = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    if (buckets.size > 5000) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k)
    }
    return { ok: true, retryAfterS: 0 }
  }

  bucket.count++
  return {
    ok: bucket.count <= limit,
    retryAfterS: Math.ceil((bucket.resetAt - now) / 1000),
  }
}

/**
 * Client IP for rate limiting. The first X-Forwarded-For entry is whatever the client sent
 * (spoofable, which would let an attacker reset their own limit), so prefer the proxy-set
 * x-real-ip (Vercel, nginx), then the LAST X-Forwarded-For hop, which our proxy appended.
 */
export function clientIp(request: Request): string {
  const realIp = request.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp
  const hops = request.headers.get('x-forwarded-for')?.split(',').map((h) => h.trim()).filter(Boolean)
  return hops?.at(-1) || 'unknown'
}
