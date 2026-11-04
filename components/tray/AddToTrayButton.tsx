'use client'

import { Check, Plus } from 'lucide-react'
import { track } from '@vercel/analytics'
import { openTray, useTray, type TrayItem } from '@/lib/tray-store'
import type { Translations } from '@/data/translations'
import { buttonClass } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AddToTrayButtonProps {
  item: TrayItem
  available: boolean
  t: Translations['tray']
  /** "card": compact pill over a product card · "full": large button on the product page. */
  variant?: 'card' | 'full'
}

export default function AddToTrayButton({ item, available, t, variant = 'full' }: AddToTrayButtonProps) {
  const tray = useTray()
  const inTray = tray.has(item.id)
  const disabled = !available || (!inTray && tray.isFull)
  const label = !available ? t.unavailable : inTray ? t.added : tray.isFull ? t.full : variant === 'card' ? t.add_short : t.add

  function onClick() {
    if (inTray) return openTray()
    if (tray.add(item)) {
      track('tray_add', { product: item.slug })
      if (variant === 'full') openTray()
    }
  }

  if (variant === 'card') {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={inTray}
        className={cn(
          // z-10 keeps it above the card's stretched link.
          'relative z-10 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-soft backdrop-blur transition-colors disabled:cursor-not-allowed disabled:opacity-60',
          inTray ? 'bg-ink text-white' : 'bg-surface/90 text-ink hover:bg-surface'
        )}
      >
        {inTray ? <Check size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
        {label}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={inTray}
      className={buttonClass({ variant: inTray ? 'primary' : 'secondary', size: 'lg', className: 'w-full' })}
    >
      {inTray ? <Check size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
      {label}
    </button>
  )
}
