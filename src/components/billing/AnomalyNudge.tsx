import { calculateDeviation, getAnomalyTier, ANOMALY_THRESHOLDS } from '@/lib/anomaly'

interface AnomalyNudgeProps {
  scannedAmount: number
  history: number[]
}

export default function AnomalyNudge({ scannedAmount, history }: AnomalyNudgeProps) {
  if (history.length < ANOMALY_THRESHOLDS.MIN_HISTORY_MONTHS) return null

  const avg = Math.round(history.reduce((s, v) => s + v, 0) / history.length)
  const { delta, pct } = calculateDeviation(scannedAmount, history)
  const tier = getAnomalyTier(pct)
  const sign = delta > 0 ? '+' : ''

  if (tier === 'silent') {
    return (
      <div className="flex items-center gap-2 bg-green-50 rounded-xl px-3 py-2.5">
        <span className="text-sm">📊</span>
        <div>
          <p className="text-xs font-semibold text-green-700">{sign}{pct}% dari purata {history.length} bulan</p>
          <p className="text-[11px] text-green-600">Normal. Boleh teruskan.</p>
        </div>
      </div>
    )
  }

  if (tier === 'warning') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm">⚠️</span>
          <p className="text-xs font-semibold text-amber-700">
            {sign}{pct}% dari purata (RM{avg})
          </p>
          <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">
            ↑ {pct}%
          </span>
        </div>
        <p className="text-[11px] text-amber-600">Sila semak bil sebelum meneruskan.</p>
      </div>
    )
  }

  // blocker
  return (
    <div className="bg-amber-50 border-2 border-amber-500 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
          <span className="text-white text-lg">⚠</span>
        </div>
        <p className="text-sm font-bold text-amber-700">Double-check this bill</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold text-gray-900">RM{scannedAmount}</span>
        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold">
          ↑ {pct}%
        </span>
      </div>
      <p className="text-xs text-amber-700">
        Jumlah ini {pct}% lebih tinggi dari purata {history.length} bulan anda (RM{avg}). Sila sahkan sebelum meneruskan.
      </p>
      {/* Historical comparison bars */}
      <div className="bg-white rounded-lg p-3 space-y-2">
        {history.map((h, i) => {
          const width = Math.round((h / scannedAmount) * 100)
          const monthLabel = `${history.length - i} bulan lepas`
          return (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">{monthLabel}</span>
                <span className="text-gray-600">RM{h}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gray-300 rounded-full" style={{ width: `${width}%` }} />
              </div>
            </div>
          )
        })}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-gray-500 font-semibold">Bulan ini (scanned)</span>
            <span className="text-gray-900 font-bold">RM{scannedAmount}</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
