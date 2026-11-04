'use client'

import { track } from '@vercel/analytics'
import type { AnchorHTMLAttributes } from 'react'

interface TrackedLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  /** Analytics event name, e.g. "whatsapp_click" or "phone_click". */
  event: string
  /** Where on the site the click happened, e.g. "hero" or "product". */
  placement: string
  external?: boolean
}

/** Outbound link (WhatsApp / phone / maps) that records a conversion event. */
export default function TrackedLink({
  event,
  placement,
  external,
  onClick,
  children,
  ...props
}: TrackedLinkProps) {
  return (
    <a
      {...props}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      onClick={(e) => {
        track(event, { placement })
        onClick?.(e)
      }}
    >
      {children}
    </a>
  )
}
