'use client'

import { useCallback, useState } from 'react'
import dynamic from 'next/dynamic'
import { ScanFace } from 'lucide-react'
import type { Locale, Translations } from '@/data/translations'
import { buttonClass } from '@/components/ui/button'
import type { TryOnProduct } from './TryOnStudio'

// MediaPipe + the studio are only downloaded when a visitor actually opens the try-on.
const TryOnStudio = dynamic(() => import('./TryOnStudio'), { ssr: false })

interface TryOnLauncherProps {
  locale: Locale
  t: Translations['tryon']
  product?: TryOnProduct | null
  label: string
  variant?: 'primary' | 'secondary' | 'inverse'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function TryOnLauncher({
  locale,
  t,
  product,
  label,
  variant = 'secondary',
  size = 'lg',
  className,
}: TryOnLauncherProps) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={buttonClass({ variant, size, className })}
      >
        <ScanFace size={size === 'sm' ? 15 : 17} aria-hidden="true" />
        {label}
      </button>
      {open && <TryOnStudio locale={locale} t={t} product={product} onClose={close} />}
    </>
  )
}
