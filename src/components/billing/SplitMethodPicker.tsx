import { Gauge, Divide, Pin, Home } from 'lucide-react'
import type { SplitMethod } from '@/types/database'

interface SplitMethodPickerProps {
  value: SplitMethod
  onChange: (method: SplitMethod) => void
  totalAmount?: number
  occupiedRoomCount: number
}

interface MethodOption {
  value: SplitMethod
  icon: typeof Gauge
  title: string
  description: string
  tag: string
  getExample?: (total: number, rooms: number) => string
}

const methods: MethodOption[] = [
  {
    value: 'sub_meter',
    icon: Gauge,
    title: 'Sub-meter',
    description: 'Setiap bilik ada meter sendiri',
    tag: 'Paling adil',
    getExample: () => 'Bayar ikut kWh sebenar',
  },
  {
    value: 'equal',
    icon: Divide,
    title: 'Bahagi sama rata',
    description: 'Jumlah ÷ bilangan bilik',
    tag: 'Mudah',
    getExample: (total, rooms) => rooms > 0 ? `RM${total} ÷ ${rooms} = RM${Math.round(total / rooms)}` : '',
  },
  {
    value: 'fixed',
    icon: Pin,
    title: 'Jumlah tetap',
    description: 'Kadar tetap per bilik',
    tag: 'Boleh diramal',
  },
  {
    value: 'absorbed',
    icon: Home,
    title: 'Tuan rumah tanggung',
    description: 'Penyewa bayar sewa sahaja',
    tag: 'Paling mudah',
  },
]

export default function SplitMethodPicker({ value, onChange, totalAmount = 0, occupiedRoomCount }: SplitMethodPickerProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 font-medium">Kaedah pembahagian:</p>
      <div className="grid grid-cols-2 gap-2">
        {methods.map((m) => {
          const isSelected = value === m.value
          const Icon = m.icon
          const example = m.getExample?.(totalAmount, occupiedRoomCount)

          return (
            <button
              key={m.value}
              type="button"
              onClick={() => onChange(m.value)}
              className={`text-left p-3 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Icon size={14} className={isSelected ? 'text-primary-600' : 'text-gray-400'} />
                <span className={`text-xs font-semibold ${isSelected ? 'text-primary-700' : 'text-gray-700'}`}>
                  {m.title}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 leading-tight mb-1.5">{m.description}</p>
              {example && totalAmount > 0 && (
                <p className="text-[11px] font-medium text-primary-600">{example}</p>
              )}
              <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full mt-1 ${
                isSelected ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {m.tag}
              </span>
            </button>
          )
        })}
      </div>
      <p className="text-[11px] text-gray-400">Tak pasti? Kebanyakan tuan rumah guna "Bahagi sama rata".</p>
    </div>
  )
}
