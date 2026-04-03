type Status = 'paid' | 'overdue' | 'partial' | 'pending' | 'active' | 'ended' | 'occupied' | 'vacant'

const statusConfig: Record<Status, { label: string; className: string }> = {
  paid: { label: 'Selesai', className: 'bg-success-50 text-green-700' },
  overdue: { label: 'Tertunggak', className: 'bg-danger-50 text-red-700' },
  partial: { label: 'Separa', className: 'bg-warning-50 text-amber-700' },
  pending: { label: 'Belum Bayar', className: 'bg-gray-100 text-gray-600' },
  active: { label: 'Aktif', className: 'bg-success-50 text-green-700' },
  ended: { label: 'Tamat', className: 'bg-gray-100 text-gray-600' },
  occupied: { label: 'Berisi', className: 'bg-success-50 text-green-700' },
  vacant: { label: 'Kosong', className: 'bg-warning-50 text-amber-700' },
}

interface StatusBadgeProps {
  status: Status
  label?: string
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status, label, size = 'sm' }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending
  const sizeClass = size === 'md' ? 'text-sm px-3 py-1' : 'text-xs px-2 py-0.5'

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${config.className} ${sizeClass}`}>
      {label || config.label}
    </span>
  )
}
