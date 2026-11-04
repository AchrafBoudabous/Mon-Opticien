import { LoadingRegion, Skeleton } from '@/components/Skeletons'

export default function AdminLoading() {
  return (
    <LoadingRegion label="Chargement…">
      <div className="border-b border-line bg-surface px-6 py-4">
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="mx-auto max-w-7xl space-y-3 px-6 py-8">
        <Skeleton className="mb-6 h-8 w-40" />
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    </LoadingRegion>
  )
}
