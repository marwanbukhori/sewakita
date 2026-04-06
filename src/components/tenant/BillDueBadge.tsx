interface BillDueBadgeProps {
  dueDate: string
  status: string
}

export default function BillDueBadge({ dueDate, status }: BillDueBadgeProps) {
  if (status === 'paid') return null

  const now = new Date()
  const due = new Date(dueDate)
  const diffMs = due.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  let label: string
  let color: string

  if (diffDays < 0) {
    label = `Tertunggak ${Math.abs(diffDays)} hari`
    color = 'text-red-600 bg-red-50'
  } else if (diffDays === 0) {
    label = 'Hari terakhir bayar'
    color = 'text-amber-700 bg-amber-50'
  } else if (diffDays === 1) {
    label = 'Esok hari akhir bayar'
    color = 'text-amber-700 bg-amber-50'
  } else if (diffDays <= 5) {
    label = `${diffDays} hari lagi`
    color = 'text-amber-700 bg-amber-50'
  } else {
    label = `${diffDays} hari lagi`
    color = 'text-gray-600 bg-gray-50'
  }

  // Progress bar: how much of the month has passed
  const monthStart = new Date(due.getFullYear(), due.getMonth(), 1)
  const monthDays = new Date(due.getFullYear(), due.getMonth() + 1, 0).getDate()
  const elapsed = Math.max(0, Math.min(monthDays, Math.ceil((now.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24))))
  const progressPct = Math.round((elapsed / monthDays) * 100)

  return (
    <div className={`rounded-lg px-2.5 py-1.5 ${color}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold">{label}</span>
        <span className="text-[10px] opacity-70">
          {new Date(dueDate).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })}
        </span>
      </div>
      <div className="h-1 bg-white/50 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${diffDays < 0 ? 'bg-red-500' : diffDays <= 5 ? 'bg-amber-500' : 'bg-gray-400'}`}
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  )
}
