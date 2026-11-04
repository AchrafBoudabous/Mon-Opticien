import TrackedLink from '@/components/ui/TrackedLink'
import { WhatsAppIcon } from '@/components/ui/icons'
import { whatsappUrl } from '@/lib/site'

export default function WhatsAppButton({ label, message }: { label: string; message: string }) {
  return (
    <TrackedLink
      href={whatsappUrl(message)}
      event="whatsapp_click"
      placement="floating"
      external
      aria-label={label}
      className="group fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-lift transition-transform duration-300 hover:-translate-y-0.5 hover:bg-whatsapp-hover sm:bottom-6 sm:right-6"
    >
      <WhatsAppIcon size={26} />
      <span className="pointer-events-none absolute right-[4.25rem] hidden whitespace-nowrap rounded-full bg-ink px-3 py-1.5 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:block">
        {label}
      </span>
    </TrackedLink>
  )
}
