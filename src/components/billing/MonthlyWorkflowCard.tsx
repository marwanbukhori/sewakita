import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Card from '@/components/ui/Card'

export interface PropertyStatus {
  id: string
  name: string
  hasUtilities: boolean
  hasBills: boolean
  billCount: number
  paidCount: number
}

interface MonthlyWorkflowCardProps {
  month: string
  properties: PropertyStatus[]
  onPropertyAction: (propertyId: string) => void
}

export default function MonthlyWorkflowCard({
  month,
  properties,
  onPropertyAction,
}: MonthlyWorkflowCardProps) {
  const { t } = useTranslation()
  const monthLabel = new Date(month + '-01').toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' })

  const totalProperties = properties.length
  const doneProperties = properties.filter(p => p.hasBills).length
  const progressPct = totalProperties > 0 ? Math.round((doneProperties / totalProperties) * 100) : 0

  const totalBills = properties.reduce((s, p) => s + p.billCount, 0)
  const totalPaid = properties.reduce((s, p) => s + p.paidCount, 0)
  const collectionPct = totalBills > 0 ? Math.round((totalPaid / totalBills) * 100) : 0

  return (
    <Card variant="elevated" padding="p-4">
      {/* Month + overall progress */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs font-semibold text-primary-600 uppercase tracking-wide">{monthLabel}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalBills > 0
              ? `${totalPaid} / ${totalBills} ${t('billing.paid_short', 'dibayar')}`
              : `${doneProperties} / ${totalProperties} ${t('billing.properties_done', 'hartanah selesai')}`
            }
          </p>
        </div>
        {totalBills > 0 && (
          <span className={`text-sm font-bold ${collectionPct >= 100 ? 'text-green-600' : collectionPct > 0 ? 'text-primary-600' : 'text-gray-400'}`}>
            {collectionPct}%
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full rounded-full transition-all duration-500 ${totalBills > 0 ? (collectionPct >= 100 ? 'bg-green-500' : 'bg-primary-500') : 'bg-primary-500'}`}
          style={{ width: `${totalBills > 0 ? collectionPct : progressPct}%` }}
        />
      </div>

      {/* Per-property checklist */}
      <div className="space-y-2">
        {properties.map(p => {
          const status = p.hasBills
            ? (p.paidCount >= p.billCount ? 'done' : 'collecting')
            : p.hasUtilities ? 'ready' : 'pending'

          const statusColor = status === 'done' ? 'bg-green-500'
            : status === 'collecting' ? 'bg-primary-500'
            : status === 'ready' ? 'bg-amber-500'
            : 'bg-gray-300'

          const statusLabel = status === 'done' ? t('billing.status_done', 'Selesai')
            : status === 'collecting' ? t('billing.status_collecting', `${p.paidCount}/${p.billCount} bayar`)
            : status === 'ready' ? t('billing.status_ready', 'Sedia jana')
            : t('billing.status_pending', 'Belum mula')

          return (
            <button
              key={p.id}
              onClick={() => onPropertyAction(p.id)}
              className="w-full flex items-center gap-3 bg-gray-50 hover:bg-gray-100 active:scale-[0.98] rounded-xl p-3 transition-all text-left"
            >
              {/* Color bar */}
              <div className={`w-1 h-8 rounded-full shrink-0 ${statusColor}`} />

              {/* Property name + status */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                <p className="text-[11px] text-gray-500">{statusLabel}</p>
              </div>

              {/* Checkboxes: utilities + bills */}
              <div className="flex items-center gap-3 shrink-0">
                <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                  p.hasUtilities ? 'bg-green-500' : 'border-2 border-gray-300'
                }`}>
                  {p.hasUtilities && <Check size={12} className="text-white" strokeWidth={3} />}
                </div>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                  p.hasBills ? 'bg-green-500' : 'border-2 border-gray-300'
                }`}>
                  {p.hasBills && <Check size={12} className="text-white" strokeWidth={3} />}
                </div>
              </div>

              <span className="text-gray-300 text-sm">›</span>
            </button>
          )
        })}
      </div>

      {/* Column labels */}
      {properties.length > 0 && (
        <div className="flex justify-end mt-1 pr-8">
          <span className="text-[9px] text-gray-400 w-5 text-center">Util</span>
          <span className="text-[9px] text-gray-400 w-5 text-center ml-3">Bil</span>
        </div>
      )}
    </Card>
  )
}
