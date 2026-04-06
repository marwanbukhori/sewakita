import { useEffect, useState } from 'react'
import type { UtilityBill, UtilityType } from '@/types/database'
import { getLastNMonthsUtilities, calculateUtilityAverage } from '@/lib/utilities'

interface UtilityHistoryStripProps {
  propertyId: string
  utilityType: UtilityType
  currentMonth: string
}

export default function UtilityHistoryStrip({ propertyId, utilityType, currentMonth }: UtilityHistoryStripProps) {
  const [history, setHistory] = useState<UtilityBill[]>([])

  useEffect(() => {
    getLastNMonthsUtilities(propertyId, utilityType, 3, currentMonth).then(setHistory)
  }, [propertyId, utilityType, currentMonth])

  if (history.length === 0) return null

  const avg = calculateUtilityAverage(history)

  const formatMonth = (m: string) => {
    const d = new Date(m + '-01')
    return d.toLocaleDateString('ms-MY', { month: 'short' }).toUpperCase()
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {history.map((h, i) => (
          <div
            key={h.id}
            className={`flex-1 rounded-lg p-2 ${i === 0 ? 'bg-primary-50' : 'bg-gray-50'}`}
          >
            <p className={`text-[10px] font-semibold ${i === 0 ? 'text-primary-700' : 'text-gray-500'}`}>
              {formatMonth(h.month)}
            </p>
            <p className={`text-sm font-bold ${i === 0 ? 'text-primary-800' : 'text-gray-700'}`}>
              RM{h.total_amount}
            </p>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 flex items-center gap-1">
        <span>📊</span> Purata {history.length} bulan: RM{avg}
      </p>
    </div>
  )
}
