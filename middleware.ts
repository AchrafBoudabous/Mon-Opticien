import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth'

const locales = ['fr', 'en'] as const
const defaultLocale = 'fr'

function preferredLocale(request: NextRequest): string {
  const header = request.headers.get('accept-language') ?? ''
  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=')
      return { lang: tag.slice(0, 2).toLowerCase(), q: q ? Number(q) : 1 }
    })
    .sort((a, b) => b.q - a.q)
  return ranked.find((r) => (locales as readonly string[]).includes(r.lang))?.lang ?? defaultLocale
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Admin route protection (API routes re-check the session themselves).
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (pathname === '/admin/login') return NextResponse.next()
    const valid = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)
    if (!valid) {
      const url = new URL('/admin/login', request.url)
      const res = NextResponse.redirect(url)
      res.cookies.delete(SESSION_COOKIE)
      return res
    }
    return NextResponse.next()
  }

  const hasLocale = locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))
  if (hasLocale) return NextResponse.next()

  // `/` → best match from Accept-Language; any other unprefixed path → default locale.
  const locale = pathname === '/' ? preferredLocale(request) : defaultLocale
  const url = request.nextUrl.clone()
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`
  return NextResponse.redirect(url, pathname === '/' ? 307 : 308)
}

export const config = {
  // Skip Next internals, API routes and any file with an extension (robots.txt, sitemap.xml, icons…).
  matcher: ['/((?!_next/static|_next/image|api|.*\\..*).*)'],
}
