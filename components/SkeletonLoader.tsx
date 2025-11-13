// components/SkeletonLoader.tsx
export function SkeletonCard() {
  return (
    <div className="rounded-xl bg-slate-900 border border-slate-700 p-6 animate-pulse">
      <div className="h-4 bg-slate-700 rounded w-1/3 mb-4"></div>
      <div className="h-8 bg-slate-700 rounded w-2/3 mb-2"></div>
      <div className="h-6 bg-slate-700 rounded w-1/2"></div>
    </div>
  )
}

export function SkeletonTable() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex gap-4">
          <div className="h-12 bg-slate-800 rounded w-12"></div>
          <div className="h-12 bg-slate-800 rounded flex-1"></div>
          <div className="h-12 bg-slate-800 rounded w-32"></div>
          <div className="h-12 bg-slate-800 rounded w-24"></div>
        </div>
      ))}
    </div>
  )
}
