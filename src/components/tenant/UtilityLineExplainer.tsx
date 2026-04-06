import { useState } from 'react'
import { Info } from 'lucide-react'
import BottomSheet from '@/components/ui/BottomSheet'

interface UtilityLineExplainerProps {
  type: string
  amount: number
  splitMethod?: string
  propertyTotal?: number
  roomCount?: number
  roomReading?: number
  totalReadings?: number
}

export default function UtilityLineExplainer({
  type,
  amount,
  splitMethod,
  propertyTotal,
  roomCount,
  roomReading,
  totalReadings,
}: UtilityLineExplainerProps) {
  const [open, setOpen] = useState(false)

  const typeLabel = type === 'electric' ? 'Elektrik' : type === 'water' ? 'Air' : 'Internet'
  const unit = type === 'electric' ? 'kWh' : type === 'water' ? 'm³' : ''

  let explanation = ''
  if (splitMethod === 'sub_meter' && roomReading && totalReadings && propertyTotal) {
    const pct = Math.round((roomReading / totalReadings) * 100)
    explanation = `Penggunaan bilik: ${roomReading} ${unit}\nJumlah bangunan: ${totalReadings} ${unit}\nBahagian anda: ${pct}% = RM${amount}`
  } else if (splitMethod === 'equal' && propertyTotal && roomCount) {
    explanation = `RM${propertyTotal} ÷ ${roomCount} bilik = RM${amount} setiap bilik`
  } else if (splitMethod === 'fixed') {
    explanation = `Kadar tetap oleh tuan rumah: RM${amount}`
  } else if (splitMethod === 'absorbed') {
    explanation = 'Tuan rumah menanggung kos ini'
  } else {
    explanation = `Jumlah: RM${amount}`
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-0.5 text-gray-400 hover:text-primary-600 transition-colors"
      >
        <Info size={12} />
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title={`${typeLabel} — Perincian`}>
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-gray-900 mb-1">RM{amount}</p>
            <p className="text-xs text-gray-500 capitalize">{typeLabel}</p>
          </div>
          <div className="bg-primary-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-primary-700 mb-2">Cara pengiraan</p>
            <p className="text-sm text-primary-800 whitespace-pre-line">{explanation}</p>
          </div>
          {splitMethod && (
            <p className="text-[11px] text-gray-400">
              Kaedah: {splitMethod === 'sub_meter' ? 'Sub-meter' : splitMethod === 'equal' ? 'Bahagi sama rata' : splitMethod === 'fixed' ? 'Jumlah tetap' : 'Tuan rumah tanggung'}
            </p>
          )}
        </div>
      </BottomSheet>
    </>
  )
}
