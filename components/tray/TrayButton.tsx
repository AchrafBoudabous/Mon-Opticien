'use client'

import { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { ShoppingBag } from 'lucide-react'
import { TRAY_OPEN_EVENT, useTray } from '@/lib/tray-store'
import type { Locale, Translations } from '@/data/translations'

// The booking dialog is only downloaded the first time it is opened.
const TrayDialog = dynamic(() => import('./TrayDialog'), { ssr: false })

interface TrayButtonProps {
  locale: Locale
  t: Translations['tray']
}

export default function TrayButton({ locale, t }: TrayButtonProps) {
  const { items } = useTray()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener(TRAY_OPEN_EVENT, onOpen)
    return () => window.removeEventListener(TRAY_OPEN_EVENT, onOpen)
  }, [])

  const count = items.length
  const close = useCallback(() => setOpen(false), [])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${t.open}${count ? ` (${count} ${count === 1 ? t.count_one : t.count_many})` : ''}`}
        aria-haspopup="dialog"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-sand"
      >
        <ShoppingBag size={19} aria-hidden="true" />
        {count > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white"
          >
            {count}
          </span>
        )}
      </button>
      {open && <TrayDialog locale={locale} t={t} onClose={close} />}
    </>
  )
}
