import type { ExtractionResult } from '../../../supabase/functions/_shared/ocr-prompts'
import BottomSheet from '@/components/ui/BottomSheet'
import Button from '@/components/ui/Button'
import AnomalyNudge from './AnomalyNudge'

interface ScanResultSheetProps {
  open: boolean
  onClose: () => void
  imageUrl?: string
  extraction: ExtractionResult | null
  historyAmounts: number[]
  onAccept: (extraction: ExtractionResult) => void
  onRescan: () => void
  onEdit: (extraction: ExtractionResult) => void
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const color = confidence >= 0.8 ? 'bg-green-500' : confidence >= 0.5 ? 'bg-amber-500' : 'bg-red-500'
  const textColor = confidence >= 0.8 ? 'text-green-600' : confidence >= 0.5 ? 'text-amber-600' : 'text-red-600'
  return (
    <div className="flex items-center gap-2">
      <span className={`text-[11px] font-semibold ${textColor}`}>{Math.round(confidence * 100)}%</span>
      <div className="w-10 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${confidence * 100}%` }} />
      </div>
    </div>
  )
}

export default function ScanResultSheet({
  open,
  onClose,
  extraction,
  historyAmounts,
  onAccept,
  onRescan,
  onEdit,
}: ScanResultSheetProps) {
  if (!extraction) return null

  const utilityLabel = extraction.utility_type === 'electric' ? 'Elektrik (TNB)'
    : extraction.utility_type === 'water' ? 'Air (SYABAS)' : 'Internet'

  return (
    <BottomSheet open={open} onClose={onClose} title="Scan result">
      <div className="space-y-4">
        {/* Success banner */}
        <div className="flex items-center gap-3 bg-green-50 rounded-xl px-4 py-3">
          <span className="text-lg">✓</span>
          <div>
            <p className="text-sm font-semibold text-green-700">Scan berjaya</p>
            <p className="text-[11px] text-green-600">{utilityLabel} · {Object.keys(extraction.confidence).length} medan dibaca</p>
          </div>
        </div>

        {/* Extracted fields */}
        <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-100">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-[11px] text-gray-500">Jumlah</p>
              <p className="text-xl font-bold text-gray-900">RM{extraction.total_amount}</p>
            </div>
            <ConfidenceBar confidence={extraction.confidence.total_amount || 0} />
          </div>
          {extraction.billing_period_start && extraction.billing_period_end && (
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-[11px] text-gray-500">Tempoh bil</p>
                <p className="text-sm font-medium text-gray-800">
                  {extraction.billing_period_start} – {extraction.billing_period_end}
                </p>
              </div>
              <ConfidenceBar confidence={extraction.confidence.billing_period || 0} />
            </div>
          )}
          {extraction.account_number && (
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-[11px] text-gray-500">Akaun</p>
                <p className="text-sm font-medium text-gray-800">{extraction.account_number}</p>
              </div>
              <ConfidenceBar confidence={extraction.confidence.account_number || 0} />
            </div>
          )}
        </div>

        {/* Anomaly nudge */}
        <AnomalyNudge
          scannedAmount={extraction.total_amount}
          history={historyAmounts}
        />

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={onRescan}>
            Scan semula
          </Button>
          <Button variant="secondary" size="sm" className="flex-1" onClick={() => onEdit(extraction)}>
            Edit
          </Button>
          <Button size="sm" className="flex-1" onClick={() => onAccept(extraction)}>
            ✓ Terima
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}
