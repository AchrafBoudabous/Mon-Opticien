import { notFound } from 'next/navigation'

// Catch-all so unknown URLs (e.g. /fr/foo) render the localized not-found page
// inside the locale layout instead of Next's unstyled default.
export default function CatchAll() {
  notFound()
}
