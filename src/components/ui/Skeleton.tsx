interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  lines?: number
}

export default function Skeleton({ className = '', variant = 'rectangular', lines = 1 }: SkeletonProps) {
  if (variant === 'text') {
    const widths = ['w-full', 'w-4/5', 'w-3/5', 'w-2/3', 'w-1/2']
    return (
      <div className="space-y-2.5">
        {Array.from({ length: lines }, (_, i) => (
          <div key={i} className={`skeleton h-4 ${widths[i % widths.length]} ${className}`} />
        ))}
      </div>
    )
  }

  if (variant === 'circular') {
    return <div className={`skeleton rounded-full w-10 h-10 ${className}`} />
  }

  return <div className={`skeleton h-32 rounded-2xl ${className}`} />
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-card p-4 space-y-3 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="skeleton rounded-full w-10 h-10 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-2/3" />
          <div className="skeleton h-3 w-1/3" />
        </div>
      </div>
      <div className="skeleton h-3 w-full" />
      <div className="skeleton h-3 w-4/5" />
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <div className="skeleton h-4 w-32" />
        <div className="skeleton h-6 w-48" />
      </div>
      <div className="skeleton h-40 rounded-2xl" />
      <div className="grid grid-cols-4 gap-3">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div className="skeleton rounded-full w-12 h-12" />
            <div className="skeleton h-3 w-12" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="skeleton h-20 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
