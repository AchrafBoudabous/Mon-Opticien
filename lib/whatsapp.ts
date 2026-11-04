import { whatsappUrl } from '@/lib/site'
import { formatPrice } from '@/lib/utils'

export const WHATSAPP_BASE_URL = whatsappUrl()

export const generateWhatsAppUrl = (message: string): string => whatsappUrl(message)

export const generateProductWhatsAppUrl = (
  productName: string,
  price: number,
  locale: string
): string => {
  const message =
    locale === 'fr'
      ? `Bonjour, je suis intéressé(e) par ce produit : ${productName}. Prix : ${formatPrice(price)} TND. Est-il disponible ?`
      : `Hello, I am interested in this product: ${productName}. Price: ${formatPrice(price)} TND. Is it available?`
  return whatsappUrl(message)
}
