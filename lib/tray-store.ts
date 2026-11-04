'use client'

import { useSyncExternalStore } from 'react'

// "Try-on tray": frames the visitor wants to try in store. Kept in localStorage (no account,
// nothing sent until they book). localStorage is user-controlled, so every read is validated.

export const MAX_TRAY_ITEMS = 5
const KEY = 'mo_tray_v1'
const EVENT = 'mo-tray-change'

export interface TrayItem {
  id: string
  slug: string
  name_fr: string
  name_en: string
  brand: string
  price: number
  image: string
}

const isSafeImage = (url: unknown): url is string => {
  if (typeof url !== 'string') return false
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && (u.hostname === 'images.unsplash.com' || u.hostname.endsWith('.supabase.co'))
  } catch {
    return false
  }
}

function isTrayItem(x: unknown): x is TrayItem {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return (
    typeof o.id === 'string' && o.id.length <= 40 &&
    typeof o.slug === 'string' && /^[a-z0-9-]{1,120}$/.test(o.slug) &&
    typeof o.name_fr === 'string' && typeof o.name_en === 'string' &&
    typeof o.brand === 'string' && typeof o.price === 'number' && Number.isFinite(o.price) &&
    isSafeImage(o.image)
  )
}

const EMPTY: TrayItem[] = []
let cache: { raw: string | null; items: TrayItem[] } = { raw: null, items: EMPTY }

function read(): TrayItem[] {
  let raw: string | null = null
  try {
    raw = window.localStorage.getItem(KEY)
  } catch {
    return EMPTY
  }
  if (raw === cache.raw) return cache.items // stable reference for useSyncExternalStore
  let items = EMPTY
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : []
    if (Array.isArray(parsed)) items = parsed.filter(isTrayItem).slice(0, MAX_TRAY_ITEMS)
  } catch {
    items = EMPTY
  }
  cache = { raw, items }
  return items
}

function write(items: TrayItem[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items))
  } catch {
    // Private mode / storage full: the tray simply won't persist.
  }
  window.dispatchEvent(new Event(EVENT))
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => e.key === KEY && onChange()
  window.addEventListener(EVENT, onChange)
  window.addEventListener('storage', onStorage) // other tabs
  return () => {
    window.removeEventListener(EVENT, onChange)
    window.removeEventListener('storage', onStorage)
  }
}

export function useTray() {
  const items = useSyncExternalStore(subscribe, read, () => EMPTY)
  return {
    items,
    isFull: items.length >= MAX_TRAY_ITEMS,
    has: (id: string) => items.some((i) => i.id === id),
    add: (item: TrayItem) => {
      const current = read()
      if (current.some((i) => i.id === item.id) || current.length >= MAX_TRAY_ITEMS || !isTrayItem(item)) return false
      write([...current, item])
      return true
    },
    remove: (id: string) => write(read().filter((i) => i.id !== id)),
    clear: () => write([]),
  }
}

/** Lets any component open the tray drawer (rendered once in the header). */
export const TRAY_OPEN_EVENT = 'mo-tray-open'
export const openTray = () => window.dispatchEvent(new Event(TRAY_OPEN_EVENT))
