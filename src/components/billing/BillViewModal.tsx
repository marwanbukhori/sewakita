import { createPortal } from 'react-dom'
import { Download, X } from 'lucide-react'
import type { MonthlyBill, Property, Room, Profile } from '@/types/database'
import { downloadBillPDF } from '@/lib/bill-pdf'
import StatusBadge from '@/components/ui/StatusBadge'
import Button from '@/components/ui/Button'

interface BillWithDetails extends MonthlyBill {
  room: Room & { property: Property }
  tenant: Profile
}

interface BillViewModalProps {
  bill: BillWithDetails | null
  onClose: () => void
}

const MALAY_MONTHS = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember']

function formatMonth(month: string): string {
  const [year, m] = month.split('-')
  return `${MALAY_MONTHS[parseInt(m) - 1]} ${year}`
}

export default function BillViewModal({ bill, onClose }: BillViewModalProps) {
  if (!bill) return null

  const utilities = (bill.utility_breakdown || []) as { type: string; amount: number; split_method?: string }[]
  const balance = bill.total_due - bill.total_paid

  function getUtilityLabel(type: string) {
    if (type === 'electric') return 'Elektrik'
    if (type === 'water') return 'Air'
    return 'Internet'
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl animate-in">
        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-white/80 hover:bg-gray-100">
          <X size={18} className="text-gray-500" />
        </button>

        {/* Bill header */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 px-6 pt-6 pb-5 rounded-t-2xl sm:rounded-t-2xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/70 text-xs font-medium">ReRumah</p>
              <p className="text-white text-lg font-bold">Bil Bulanan</p>
            </div>
            <StatusBadge
              status={bill.status as 'paid' | 'overdue' | 'partial' | 'pending'}
              size="md"
            />
          </div>
          <p className="text-white text-2xl font-bold">{formatMonth(bill.month)}</p>
        </div>

        {/* Info rows */}
        <div className="px-6 py-4 space-y-3 border-b border-gray-100">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Hartanah</span>
            <span className="font-medium text-gray-800">{bill.room.property.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Bilik</span>
            <span className="font-medium text-gray-800">{bill.room.label}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Penyewa</span>
            <span className="font-medium text-gray-800">{bill.tenant.name}</span>
          </div>
          {bill.due_date && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tarikh akhir</span>
              <span className="font-medium text-gray-800">
                {new Date(bill.due_date).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          )}
        </div>

        {/* Breakdown */}
        <div className="px-6 py-4 space-y-3 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Perincian</p>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Sewa bilik</span>
            <span className="font-medium">RM{bill.rent_amount.toFixed(2)}</span>
          </div>

          {utilities.filter(u => u.amount > 0).map((u, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-600">{getUtilityLabel(u.type)}</span>
              <span className="font-medium">RM{u.amount.toFixed(2)}</span>
            </div>
          ))}

          <div className="border-t border-gray-200 pt-3 flex justify-between">
            <span className="text-sm font-bold text-gray-800">Jumlah</span>
            <span className="text-lg font-bold text-gray-900">RM{bill.total_due.toFixed(2)}</span>
          </div>

          {bill.total_paid > 0 && (
            <>
              <div className="flex justify-between text-sm text-green-600">
                <span>Telah dibayar</span>
                <span className="font-medium">- RM{bill.total_paid.toFixed(2)}</span>
              </div>
              {balance > 0 && (
                <div className="flex justify-between text-sm text-red-600 font-bold">
                  <span>Baki</span>
                  <span>RM{balance.toFixed(2)}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 space-y-3">
          <p className="text-[10px] text-gray-400 text-center">
            Bil ini dijana secara automatik oleh ReRumah · Ref: {bill.id.slice(0, 8)}
          </p>

          <Button icon={Download} fullWidth variant="secondary" onClick={() => downloadBillPDF(bill)}>
            Muat turun PDF
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
