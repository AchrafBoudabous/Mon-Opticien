'use client'

import { Printer } from 'lucide-react'
import { buttonClass } from '@/components/ui/button'

export default function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className={buttonClass({ size: 'sm' })}>
      <Printer size={16} aria-hidden="true" /> Imprimer
    </button>
  )
}
