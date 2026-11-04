import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Locale } from '@/data/translations'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const locales: Locale[] = ['fr', 'en']
export const defaultLocale: Locale = 'fr'

export const isValidLocale = (locale: string): locale is Locale =>
  locales.includes(locale as Locale)

export const switchLocalePath = (currentPath: string, targetLocale: Locale): string => {
  for (const locale of locales) {
    if (currentPath.startsWith(`/${locale}/`)) {
      return `/${targetLocale}/${currentPath.slice(locale.length + 2)}`
    }
    if (currentPath === `/${locale}`) {
      return `/${targetLocale}`
    }
  }
  return `/${targetLocale}`
}

export const formatPrice = (price: number): string =>
  price.toLocaleString('fr-TN', { maximumFractionDigits: 3 })

const categoryLabels: Record<string, Record<Locale, string>> = {
  sunglasses: { fr: 'Lunettes de soleil', en: 'Sunglasses' },
  eyeglasses: { fr: 'Lunettes optiques', en: 'Eyeglasses' },
  contact_lenses: { fr: 'Lentilles', en: 'Contact lenses' },
}

const genderLabels: Record<string, Record<Locale, string>> = {
  men: { fr: 'Hommes', en: 'Men' },
  women: { fr: 'Femmes', en: 'Women' },
  unisex: { fr: 'Unisexe', en: 'Unisex' },
}

export const getCategoryLabel = (category: string, locale: Locale): string =>
  categoryLabels[category]?.[locale] ?? category

export const getGenderLabel = (gender: string, locale: Locale): string =>
  genderLabels[gender]?.[locale] ?? gender
