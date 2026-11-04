'use client'

import { useEffect } from 'react'
import { track } from '@vercel/analytics'

/**
 * In-store frame labels link to `…/products/<slug>?ref=qr`. Reading the flag on the client keeps
 * the product page statically cached (ISR); the param is then removed so shares/reloads don't
 * count twice.
 */
export default function QrScanTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.get('ref') !== 'qr') return
    track('qr_scan', { product: slug })
    url.searchParams.delete('ref')
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash)
  }, [slug])
  return null
}
