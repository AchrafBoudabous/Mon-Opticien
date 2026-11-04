import 'server-only'
import { revalidatePath } from 'next/cache'

/** Refresh every cached public page after a catalogue change. */
export function revalidateCatalogue() {
  revalidatePath('/[locale]', 'layout')
  revalidatePath('/sitemap.xml')
}
