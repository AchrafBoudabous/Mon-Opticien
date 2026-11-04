import 'server-only'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth'

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies()
  return verifySessionToken(store.get(SESSION_COOKIE)?.value)
}

export const unauthorized = () =>
  NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

/**
 * Defence in depth for admin pages: middleware already redirects anonymous visitors, but each
 * page re-checks the session so a middleware bypass (cf. CVE-2025-29927) can't expose data.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await isAuthenticated())) redirect('/admin/login')
}
