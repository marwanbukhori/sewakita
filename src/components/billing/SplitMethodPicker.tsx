import { Gauge, Divide, Pin, Home } from 'lucide-react'
import type { SplitMethod } from '@/types/database'

interface SplitMethodPickerProps {
  value: SplitMethod
  onChange: (method: SplitMethod) => void
  totalAmount?: number
  occupiedRoomCount: number
}

const methods = [
  { value: 'sub_meter' as SplitMethod, icon: Gauge, title: 'Sub-meter', desc: 'Bayar ikut meter', tag: 'Adil' },
  { value: 'equal' as SplitMethod, icon: Divide, title: 'Sama rata', desc: 'Jumlah ÷ bilik', tag: 'Mudah' },
  { value: 'fixed' as SplitMethod, icon: Pin, title: 'Tetap', desc: 'Kadar tetap', tag: 'Diramal' },
  { value: 'absorbed' as SplitMethod, icon: Home, title: 'Tanggung', desc: 'Sewa sahaja', tag: 'Simple' },
]

export default function SplitMethodPicker({ value, onChange, totalAmount = 0, occupiedRoomCount }: SplitMethodPickerProps) {
  const equalExample = occupiedRoomCount > 0 && totalAmount > 0
    ? `RM${totalAmount} ÷ ${occupiedRoomCount} = RM${Math.round(totalAmount / occupiedRoomCount)}`
    : null

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-gray-500 font-medium">Kaedah pembahagian:</p>
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {methods.map((m) => {
          const isSelected = value === m.value
          const Icon = m.icon
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => onChange(m.value)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all whitespace-nowrap shrink-0 ${
                isSelected
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <Icon size={14} className={isSelected ? 'text-primary-600' : 'text-gray-400'} />
              <div className="text-left">
                <p className={`text-xs font-semibold leading-none ${isSelected ? 'text-primary-700' : 'text-gray-700'}`}>{m.title}</p>
                <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{m.desc}</p>
              </div>
            </button>
          )
        })}
      </div>
      {value === 'equal' && equalExample && (
        <p className="text-[11px] text-primary-600 font-medium">{equalExample}</p>
      )}
    </div>
  )
}
