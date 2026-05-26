export function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 p-5 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-full" />
        </div>
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="h-10 bg-gray-100 rounded w-full max-w-md animate-pulse" />
      <div className="space-y-4 mt-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
