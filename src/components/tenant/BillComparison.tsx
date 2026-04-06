import type { MonthlyBill } from '@/types/database'

interface BillComparisonProps {
  currentBill: MonthlyBill
  previousBill?: MonthlyBill | null
}

export default function BillComparison({ currentBill, previousBill }: BillComparisonProps) {
  if (!previousBill) return null

  const delta = currentBill.total_due - previousBill.total_due
  if (delta === 0) return null

  const sign = delta > 0 ? '+' : ''
  const color = delta > 0 ? 'text-red-600' : 'text-green-600'
  const barColor = delta > 0 ? 'bg-red-400' : 'bg-green-400'

  // Find the biggest line-item driver
  const currentUtils = (currentBill.utility_breakdown || []) as { type: string; amount: number }[]
  const prevUtils = (previousBill.utility_breakdown || []) as { type: string; amount: number }[]
  let biggestDriver = ''
  let biggestDelta = 0

  for (const cu of currentUtils) {
    const pu = prevUtils.find(p => p.type === cu.type)
    const d = cu.amount - (pu?.amount || 0)
    if (Math.abs(d) > Math.abs(biggestDelta)) {
      biggestDelta = d
      biggestDriver = cu.type
    }
  }

  const rentDelta = currentBill.rent_amount - previousBill.rent_amount
  if (Math.abs(rentDelta) > Math.abs(biggestDelta)) {
    biggestDelta = rentDelta
    biggestDriver = 'rent'
  }

  const maxAmount = Math.max(currentBill.total_due, previousBill.total_due)
  const prevWidth = maxAmount > 0 ? Math.round((previousBill.total_due / maxAmount) * 100) : 0
  const currWidth = maxAmount > 0 ? Math.round((currentBill.total_due / maxAmount) * 100) : 0

  const driverLabel = biggestDriver === 'rent' ? 'sewa'
    : biggestDriver === 'electric' ? 'elektrik'
    : biggestDriver === 'water' ? 'air'
    : biggestDriver === 'internet' ? 'internet'
    : biggestDriver

  return (
    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
      <p className="text-[11px] font-semibold text-gray-500">vs bulan lepas</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-gray-500">Bulan lepas</span>
          <span className="text-gray-600">RM{previousBill.total_due}</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gray-400 rounded-full" style={{ width: `${prevWidth}%` }} />
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="text-gray-500">Bulan ini</span>
          <span className="text-gray-900 font-semibold">RM{currentBill.total_due}</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full ${barColor} rounded-full`} style={{ width: `${currWidth}%` }} />
        </div>
      </div>

      <p className={`text-[11px] ${color}`}>
        {sign}RM{Math.abs(delta)}
        {biggestDriver && biggestDelta !== 0 && ` — ${driverLabel} ${biggestDelta > 0 ? '↑' : '↓'} RM${Math.abs(biggestDelta)}`}
      </p>
    </div>
  )
}
