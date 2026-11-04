'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface ProductGalleryProps {
  images: string[]
  alt: string
  viewLabel: string
}

export default function ProductGallery({ images, alt, viewLabel }: ProductGalleryProps) {
  const [active, setActive] = useState(0)
  const current = images[active] ?? images[0]

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-sand">
        {current && (
          <Image
            key={current}
            src={current}
            alt={active === 0 ? alt : `${alt} — ${viewLabel} ${active + 1}`}
            fill
            priority={active === 0}
            className="animate-[fade-up_0.4s_ease-out_both] object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        )}
      </div>

      {images.length > 1 && (
        <ul className="grid grid-cols-4 gap-3" aria-label={viewLabel}>
          {images.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-current={i === active ? 'true' : undefined}
                className={cn(
                  'relative block aspect-square w-full overflow-hidden rounded-xl bg-sand ring-offset-2 ring-offset-paper transition',
                  i === active ? 'ring-2 ring-ink' : 'opacity-70 hover:opacity-100'
                )}
              >
                {/* The thumbnail's alt text is the button's accessible name. */}
                <Image src={src} alt={`${alt} — ${viewLabel} ${i + 1}`} fill className="object-cover" sizes="120px" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
