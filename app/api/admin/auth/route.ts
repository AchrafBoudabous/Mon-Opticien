import { NextResponse } from 'next/server'
import { checkPassword, createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE_S } from '@/lib/auth'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { forbidden, isSameOrigin, readJson, payloadTooLarge } from '@/lib/request-guard'

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return forbidden()
  // Per-IP limit, plus a global ceiling that still holds if the client IP can be spoofed
  // (e.g. self-hosted without a proxy that sets x-real-ip).
  const windowMs = 15 * 60 * 1000
  const perIp = rateLimit(`login:${clientIp(request)}`, 5, windowMs)
  const globalLimit = rateLimit('login:global', 50, windowMs)
  if (!perIp.ok || !globalLimit.ok) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Réessayez plus tard.' },
      { status: 429, headers: { 'Retry-After': String(Math.max(perIp.retryAfterS, globalLimit.retryAfterS)) } }
    )
  }

  let body: unknown
  try {
    body = await readJson(request, 2_048)
  } catch {
    return payloadTooLarge()
  }
  const password = body && typeof body === 'object' ? (body as { password?: unknown }).password : undefined

  if (!checkPassword(password)) {
    return NextResponse.json({ error: 'Mot de passe incorrect.' }, { status: 401 })
  }

  const token = await createSessionToken()
  if (!token) {
    console.error('ADMIN_SECRET is missing or shorter than 32 characters')
    return NextResponse.json({ error: 'Configuration serveur invalide.' }, { status: 500 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_MAX_AGE_S,
    path: '/',
  })
  return response
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return forbidden()
  const response = NextResponse.json({ ok: true })
  response.cookies.delete(SESSION_COOKIE)
  return response
}
