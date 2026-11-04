import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'whatsapp' | 'inverse' | 'outline-inverse'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2'

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-white hover:bg-ink-soft shadow-soft',
  secondary: 'border border-line bg-surface text-ink hover:border-ink/30 hover:bg-sand/60',
  ghost: 'text-ink hover:bg-sand',
  whatsapp: 'bg-whatsapp text-white hover:bg-whatsapp-hover shadow-soft',
  inverse: 'bg-white text-ink hover:bg-sand',
  'outline-inverse': 'border border-white/30 text-white hover:bg-white/10',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-[15px] sm:px-7',
}

export function buttonClass({
  variant = 'primary',
  size = 'md',
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], className)
}
