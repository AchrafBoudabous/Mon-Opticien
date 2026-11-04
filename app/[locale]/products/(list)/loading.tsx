import { LoadingRegion, PageHeroSkeleton, ProductGridSkeleton, Skeleton } from '@/components/Skeletons'

export default function ProductsLoading() {
  return (
    <LoadingRegion>
      <PageHeroSkeleton />
      <div className="container grid gap-10 py-12 md:py-16 lg:grid-cols-[260px_1fr] lg:gap-14">
        <div className="hidden space-y-6 lg:block">
          <Skeleton className="h-4 w-20" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-full" />
            ))}
          </div>
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <div>
          <div className="mb-6 flex justify-between border-b border-line pb-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-36 rounded-full" />
          </div>
          <ProductGridSkeleton />
        </div>
      </div>
    </LoadingRegion>
  )
}
