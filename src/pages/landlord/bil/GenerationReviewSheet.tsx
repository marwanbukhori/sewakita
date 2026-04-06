import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Property, Room, Tenancy, Profile, MonthlyBill, UtilityBill } from '@/types/database'
import { computeDraftBills, type DraftBill } from '@/lib/bill-generation'
import { calculateDeviation, getAnomalyTier, ANOMALY_THRESHOLDS } from '@/lib/anomaly'
import toast from 'react-hot-toast'
import BottomSheet from '@/components/ui/BottomSheet'
import Button from '@/components/ui/Button'

type RoomWithTenancies = Room & { tenancies: (Tenancy & { tenant: Profile })[] }

interface GenerationReviewSheetProps {
  open: boolean
  onClose: () => void
  propertyId: string
  month: string
  onGenerated: () => void
}

export default function GenerationReviewSheet({
  open,
  onClose,
  propertyId,
  month,
  onGenerated,
}: GenerationReviewSheetProps) {
  const [drafts, setDrafts] = useState<DraftBill[]>([])
  const [tenantHistory, setTenantHistory] = useState<Record<string, number[]>>({})
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open && propertyId) loadPreview()
  }, [open, propertyId, month])

  async function loadPreview() {
    setLoading(true)

    const [roomsRes, utilitiesRes, billsRes] = await Promise.all([
      supabase.from('rooms').select('*, tenancies(*, tenant:profiles!tenancies_tenant_id_fkey(*))')
        .eq('property_id', propertyId).eq('is_active', true).order('label'),
      supabase.from('utility_bills').select('*').eq('property_id', propertyId).eq('month', month),
      supabase.from('monthly_bills').select('*').eq('property_id', propertyId).eq('month', month),
    ])

    const rooms = (roomsRes.data || []) as RoomWithTenancies[]
    const utilities = (utilitiesRes.data || []) as UtilityBill[]
    const existingBills = (billsRes.data || []) as MonthlyBill[]
    const existingKeys = new Set(existingBills.map(b => `${b.room_id}_${b.tenant_id}`))

    const computed = computeDraftBills(rooms, utilities, month, propertyId, existingKeys)
    setDrafts(computed)

    // Load last 3 months per tenant for anomaly check
    const tenantIds = computed.map(d => d.tenant_id)
    if (tenantIds.length > 0) {
      const months: string[] = []
      for (let i = 1; i <= 3; i++) {
        const d = new Date(month + '-01')
        d.setMonth(d.getMonth() - i)
        months.push(d.toISOString().slice(0, 7))
      }
      const { data: histBills } = await supabase
        .from('monthly_bills')
        .select('tenant_id, total_due')
        .in('tenant_id', tenantIds)
        .in('month', months)

      const history: Record<string, number[]> = {}
      for (const b of (histBills || [])) {
        if (!history[b.tenant_id]) history[b.tenant_id] = []
        history[b.tenant_id].push(b.total_due)
      }
      setTenantHistory(history)
    }

    setLoading(false)
  }

  async function handleConfirm() {
    setGenerating(true)
    for (const draft of drafts) {
      await supabase.from('monthly_bills').insert({
        tenant_id: draft.tenant_id,
        room_id: draft.room_id,
        property_id: propertyId,
        month,
        rent_amount: draft.rent_amount,
        utility_breakdown: draft.utility_breakdown,
        total_due: draft.total_due,
        total_paid: 0,
        status: 'pending',
      })
    }
    setGenerating(false)
    toast.success(`${drafts.length} bil berjaya dijana!`)
    onGenerated()
  }

  const totalAmount = drafts.reduce((s, d) => s + d.total_due, 0)

  return (
    <BottomSheet open={open} onClose={onClose} title="Semak Bil Sebelum Jana">
      <div className="space-y-4">
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-6">Mengira...</p>
        ) : drafts.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Tiada bil baru untuk dijana. Semua penyewa sudah ada bil bulan ini.</p>
        ) : (
          <>
            {drafts.map((draft) => {
              const history = tenantHistory[draft.tenant_id] || []
              const hasAnomaly = history.length >= ANOMALY_THRESHOLDS.MIN_HISTORY_MONTHS
              let anomalyChip: React.ReactNode = null

              if (hasAnomaly) {
                const { pct } = calculateDeviation(draft.total_due, history)
                const tier = getAnomalyTier(pct)
                if (tier === 'warning') {
                  anomalyChip = <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">↑ {pct}%</span>
                } else if (tier === 'blocker') {
                  anomalyChip = <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold">⚠ {pct}%</span>
                }
              }

              return (
                <div key={draft.room_id} className="bg-white border border-gray-100 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary-600">{draft.tenant_name[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{draft.tenant_name}</p>
                        <p className="text-[11px] text-gray-500">{draft.room_label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">RM{draft.total_due}</span>
                      {anomalyChip}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-2 space-y-1 text-[12px]">
                    <div className="flex justify-between"><span className="text-gray-500">Sewa</span><span>RM{draft.rent_amount}</span></div>
                    {draft.utility_breakdown.filter(u => u.amount > 0).map(u => (
                      <div key={u.type} className="flex justify-between">
                        <span className="text-gray-500 capitalize">{u.type}</span>
                        <span>RM{u.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            <div className="bg-gray-50 rounded-xl p-3 text-sm">
              <div className="flex justify-between font-bold text-gray-800">
                <span>Jumlah: {drafts.length} bil</span>
                <span>RM{totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={onClose}>
                ← Kembali
              </Button>
              <Button className="flex-1" loading={generating} onClick={handleConfirm}>
                Jana {drafts.length} bil →
              </Button>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  )
}
