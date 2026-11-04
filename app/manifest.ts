import type { MetadataRoute } from 'next'
import { site } from '@/lib/site'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} — Montplaisir, Tunis`,
    short_name: site.name,
    description: 'Lunettes de soleil, lunettes optiques et lentilles de contact à Montplaisir, Tunis.',
    start_url: '/fr',
    display: 'standalone',
    background_color: '#FAF8F4',
    theme_color: '#151412',
    lang: 'fr',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
