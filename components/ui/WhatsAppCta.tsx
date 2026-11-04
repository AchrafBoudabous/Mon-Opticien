import TrackedLink from '@/components/ui/TrackedLink'
import { WhatsAppIcon } from '@/components/ui/icons'
import { buttonClass } from '@/components/ui/button'
import { whatsappUrl } from '@/lib/site'

interface WhatsAppCtaProps {
  label: string
  placement: string
  message?: string
  variant?: 'whatsapp' | 'primary' | 'inverse'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function WhatsAppCta({
  label,
  placement,
  message,
  variant = 'whatsapp',
  size = 'lg',
  className,
}: WhatsAppCtaProps) {
  return (
    <TrackedLink
      href={whatsappUrl(message)}
      event="whatsapp_click"
      placement={placement}
      external
      className={buttonClass({ variant, size, className })}
    >
      <WhatsAppIcon size={size === 'sm' ? 16 : 18} />
      {label}
    </TrackedLink>
  )
}
