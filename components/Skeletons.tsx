import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}

/** Wraps skeletons so assistive tech announces a single "loading" status. */
export function LoadingRegion({ label = 'Loading…', children }: { label?: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}

export function PageHeroSkeleton() {
  return (
    <div className="border-b border-line">
      <div className="container pb-12 pt-28 md:pb-16 md:pt-36">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-5 h-12 w-full max-w-xl md:h-16" />
        <Skeleton className="mt-4 h-5 w-full max-w-md" />
        <Skeleton className="mt-8 h-11 w-52 rounded-full" />
      </div>
    </div>
  )
}

export function ProductCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[4/5] rounded-2xl" />
      <div className="flex justify-between gap-4 pt-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className="h-4 w-14" />
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}
