import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { CreditCard, Check, MessageCircle, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { BatikBackground } from '@/assets/batik/patterns'
import type { MonthlyBill, Property, Room, Profile, PaymentMethod } from '@/types/database'
import toast from 'react-hot-toast'
import { generateBillMessage, generateReminderMessage, generateReceiptMessage } from '@/lib/whatsapp'
import Card from '@/components/ui/Card'
import StatusBadge from '@/components/ui/StatusBadge'
import EmptyState from '@/components/ui/EmptyState'
import BottomSheet from '@/components/ui/BottomSheet'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { SkeletonList } from '@/components/ui/Skeleton'
import MonthlyWorkflowCard from '@/components/billing/MonthlyWorkflowCard'
import UtilityEntrySheet from './bil/UtilityEntrySheet'
import GenerationReviewSheet from './bil/GenerationReviewSheet'
import BillViewModal from '@/components/billing/BillViewModal'

interface BillWithDetails extends MonthlyBill {
  room: Room & { property: Property }
  tenant: Profile
}

type StatusFilter = 'all' | 'overdue' | 'pending' | 'paid'

export default function BilPage() {
  const { profile } = useAuth()
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [loading, setLoading] = useState(true)

  // Bills state
  const [bills, setBills] = useState<BillWithDetails[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [expandedBill, setExpandedBill] = useState<string | null>(null)
  const [paymentModal, setPaymentModal] = useState<{ bill: BillWithDetails; amount: string; method: PaymentMethod } | null>(null)
  const [viewBill, setViewBill] = useState<BillWithDetails | null>(null)

  // Properties + workflow
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedProperty, setSelectedProperty] = useState<string>('')
  const [utilitiesCount, setUtilitiesCount] = useState(0)
  const [showUtilitySheet, setShowUtilitySheet] = useState(false)
  const [showReviewSheet, setShowReviewSheet] = useState(false)
  const [monthlyTrend, setMonthlyTrend] = useState<{ month: string; expected: number; collected: number }[]>([])

  useEffect(() => {
    if (!profile) return
    loadProperties()
  }, [profile])

  useEffect(() => {
    if (!profile) return
    loadBills()
    loadMonthlyTrend()
    loadUtilitiesCount()
  }, [profile, month])

  async function loadProperties() {
    const { data } = await supabase
      .from('properties').select('*').eq('landlord_id', profile!.id).eq('is_active', true)
    setProperties(data || [])
    if (data?.length) setSelectedProperty(data[0].id)
    setLoading(false)
  }

  async function loadBills() {
    const { data } = await supabase
      .from('monthly_bills')
      .select('*, room:rooms(*, property:properties(*)), tenant:profiles!monthly_bills_tenant_id_fkey(*)')
      .eq('month', month)
      .order('status')
    const myBills = (data || []).filter((b: BillWithDetails) => b.room?.property?.landlord_id === profile!.id)
    setBills(myBills)
  }

  async function loadUtilitiesCount() {
    const { count } = await supabase
      .from('utility_bills')
      .select('*', { count: 'exact', head: true })
      .eq('month', month)
      .in('property_id', properties.map(p => p.id).length > 0 ? properties.map(p => p.id) : ['__none__'])
    setUtilitiesCount(count || 0)
  }

  async function loadMonthlyTrend() {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(month + '-01')
      d.setMonth(d.getMonth() - (5 - i))
      return d.toISOString().slice(0, 7)
    })
    const { data } = await supabase
      .from('monthly_bills')
      .select('month, total_due, total_paid, rooms!inner(properties!inner(landlord_id))')
      .in('month', months)
      .eq('rooms.properties.landlord_id', profile!.id)
    const bills = (data || []) as { month: string; total_due: number; total_paid: number }[]
    const grouped = months.map(m => {
      const monthBills = bills.filter(b => b.month === m)
      return {
        month: m,
        expected: monthBills.reduce((s, b) => s + b.total_due, 0),
        collected: monthBills.reduce((s, b) => s + b.total_paid, 0),
      }
    })
    setMonthlyTrend(grouped)
  }

  // === Payment functions ===
  async function handleRecordPayment() {
    if (!paymentModal) return
    const { bill, amount, method } = paymentModal
    const payAmount = Number(amount)
    if (payAmount <= 0) { toast.error('Sila masukkan jumlah yang sah.'); return }

    const { error } = await supabase.from('payments').insert({
      bill_id: bill.id, amount: payAmount, date: new Date().toISOString().split('T')[0], method, receipt_sent: false,
    })
    if (error) { toast.error('Gagal merekod bayaran.'); return }

    const newTotalPaid = bill.total_paid + payAmount
    await supabase.from('monthly_bills').update({
      total_paid: newTotalPaid, status: newTotalPaid >= bill.total_due ? 'paid' : 'partial',
    }).eq('id', bill.id)

    toast.success('Bayaran direkod!')
    setPaymentModal(null)
    loadBills()
  }

  function handleWhatsApp(bill: BillWithDetails, type: 'bill' | 'reminder' | 'receipt') {
    const phone = bill.tenant.phone.replace(/[^0-9]/g, '').replace(/^0/, '60')
    let message = ''
    if (type === 'bill') message = generateBillMessage(bill, bill.tenant.name)
    else if (type === 'reminder') message = generateReminderMessage(bill, bill.tenant.name)
    else message = generateReceiptMessage(bill, bill.tenant.name)
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  // All hooks must be before early returns
  const statusCounts = useMemo(() => ({
    all: bills.length,
    overdue: bills.filter(b => b.status === 'overdue').length,
    pending: bills.filter(b => b.status === 'pending' || b.status === 'partial').length,
    paid: bills.filter(b => b.status === 'paid').length,
  }), [bills])

  if (loading) return <SkeletonList count={3} />

  // Computed values
  const totalExpected = bills.reduce((s, b) => s + b.total_due, 0)
  const totalCollected = bills.reduce((s, b) => s + b.total_paid, 0)
  const collectionPercent = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0

  const filteredBills = statusFilter === 'all' ? bills : bills.filter(b => {
    if (statusFilter === 'overdue') return b.status === 'overdue'
    if (statusFilter === 'pending') return b.status === 'pending' || b.status === 'partial'
    return b.status === 'paid'
  })

  const grouped = filteredBills.reduce<Record<string, { property: Property; bills: BillWithDetails[] }>>((acc, bill) => {
    const propId = bill.room?.property?.id
    if (!propId) return acc
    if (!acc[propId]) acc[propId] = { property: bill.room.property, bills: [] }
    acc[propId].bills.push(bill)
    return acc
  }, {})

  const unpaidBills = bills.filter(b => b.status !== 'paid')

  const filterOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'Semua' },
    { value: 'overdue', label: 'Tertunggak' },
    { value: 'pending', label: 'Belum Bayar' },
    { value: 'paid', label: 'Selesai' },
  ]

  // Donut segments
  const paidPct = totalExpected > 0 ? totalCollected / totalExpected : 0
  const partialAmt = bills.filter(b => b.status === 'partial').reduce((s, b) => s + b.total_paid, 0)
  const partialPct = totalExpected > 0 ? partialAmt / totalExpected : 0
  const outstandingPct = totalExpected > 0 ? 1 - paidPct : 0

  function shiftMonth(dir: number) {
    const d = new Date(month + '-01')
    d.setMonth(d.getMonth() + dir)
    setMonth(d.toISOString().slice(0, 7))
  }

  const monthLabel = new Date(month + '-01').toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })

  function handleBillsGenerated() {
    loadBills()
    loadUtilitiesCount()
    setShowUtilitySheet(false)
    setShowReviewSheet(false)
  }

  return (
    <div className="space-y-4 animate-in">
      {/* Title + Month nav */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Billing</h1>
        <div className="flex items-center gap-1 bg-white rounded-xl shadow-card px-1 py-1">
          <button onClick={() => shiftMonth(-1)} className="p-1.5 rounded-lg hover:bg-gray-50 active:scale-90 transition-transform">
            <ChevronLeft size={16} className="text-primary-600" />
          </button>
          <span className="text-[13px] font-semibold text-gray-800 px-2 min-w-[110px] text-center">{monthLabel}</span>
          <button onClick={() => shiftMonth(1)} className="p-1.5 rounded-lg hover:bg-gray-50 active:scale-90 transition-transform">
            <ChevronRight size={16} className="text-primary-600" />
          </button>
        </div>
      </div>

      {/* Monthly Workflow Card */}
      <MonthlyWorkflowCard
        month={month}
        stats={{
          utilitiesEntered: utilitiesCount,
          billsGenerated: bills.length,
          billsPaid: statusCounts.paid,
          totalBills: bills.length,
        }}
        onEnterUtilities={() => setShowUtilitySheet(true)}
        onPreviewGenerate={() => setShowReviewSheet(true)}
        onViewBills={() => {
          setStatusFilter('all')
          document.getElementById('bills-list')?.scrollIntoView({ behavior: 'smooth' })
        }}
        onSendReminders={() => unpaidBills.forEach(bill => handleWhatsApp(bill, bill.status === 'overdue' ? 'reminder' : 'bill'))}
      />

      {/* Analytics (visible when bills exist) */}
      {bills.length > 0 && (
        <div className="relative bg-white rounded-2xl shadow-md overflow-hidden">
          <BatikBackground className="!opacity-[0.04]" />
          <div className="relative z-10 p-5">
            <div className="flex items-center gap-5 mb-5">
              <div className="relative shrink-0">
                <DonutChart size={120} strokeWidth={12} segments={[
                  { pct: paidPct, color: '#22c55e' },
                  { pct: partialPct, color: '#f59e0b' },
                  { pct: outstandingPct, color: '#ef4444' },
                ]} bgColor="rgba(0,0,0,0.06)" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-base font-bold text-gray-800">RM{totalExpected > 0 ? totalExpected.toLocaleString() : '0'}</span>
                  <span className="text-[9px] text-gray-400">expected</span>
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <LegendRow color="#22c55e" label="Collected" value={`RM${totalCollected.toLocaleString()}`} />
                <LegendRow color="#f59e0b" label="Partial" value={`RM${partialAmt.toLocaleString()}`} />
                <LegendRow color="#ef4444" label="Outstanding" value={`RM${(totalExpected - totalCollected).toLocaleString()}`} />
                <div className="bg-gray-50 rounded-lg px-3 py-1.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-500">Collection Rate</span>
                    <span className="text-[10px] font-bold text-green-600">{collectionPercent}%</span>
                  </div>
                  <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${collectionPercent}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl px-3 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-gray-500">Monthly Trend</span>
                <span className="text-[9px] text-gray-400">Last 6 months</span>
              </div>
              <MonthlyBarChart currentMonth={month} data={monthlyTrend} />
            </div>
          </div>
        </div>
      )}

      {/* Filter pills */}
      {bills.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
          {filterOptions.map((opt) => (
            <button key={opt.value} onClick={() => setStatusFilter(opt.value)}
              className={`px-3.5 h-9 rounded-full text-xs font-semibold whitespace-nowrap active:scale-95 transition-all ${
                statusFilter === opt.value ? 'bg-primary-600 text-white shadow-sm' : 'bg-white text-gray-600 shadow-card hover:bg-gray-50'
              }`}>
              {opt.label} ({statusCounts[opt.value]})
            </button>
          ))}
        </div>
      )}

      {/* Bills grouped by property */}
      <div id="bills-list" />
      {filteredBills.length === 0 && bills.length === 0 ? (
        <EmptyState icon={CreditCard} title="Tiada bil untuk bulan ini" />
      ) : filteredBills.length === 0 ? (
        <EmptyState icon={CreditCard} title="Tiada bil yang sepadan" />
      ) : (
        <div className="space-y-4">
          {Object.values(grouped).map(({ property, bills: propBills }) => (
            <Card key={property.id} variant="elevated" padding="p-0">
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <span className="text-xs font-bold text-gray-800">{property.name}</span>
                <span className="text-[11px] text-gray-400">{propBills.length} bills · RM{propBills.reduce((s, b) => s + b.total_due, 0).toLocaleString()}</span>
              </div>
              <div className="divide-y divide-gray-100">
                {propBills.map((bill) => {
                  const isExpanded = expandedBill === bill.id
                  return (
                    <div key={bill.id}>
                      <button onClick={() => setExpandedBill(isExpanded ? null : bill.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-primary-600">{bill.tenant?.name?.[0]}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{bill.tenant?.name}</p>
                          <p className="text-[11px] text-gray-500">{bill.room?.label}</p>
                        </div>
                        <p className="font-bold text-gray-900 text-sm shrink-0">RM{bill.total_due}</p>
                        <StatusBadge status={bill.status as 'paid' | 'overdue' | 'partial' | 'pending'} />
                        {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-3 space-y-3">
                          <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm">
                            <div className="flex justify-between"><span className="text-gray-500">Rent</span><span>RM{bill.rent_amount}</span></div>
                            {(bill.utility_breakdown as { type: string; amount: number }[])?.map((u) => (
                              <div key={u.type} className="flex justify-between"><span className="text-gray-500 capitalize">{u.type}</span><span>RM{u.amount}</span></div>
                            ))}
                            <hr className="border-gray-200" />
                            <div className="flex justify-between font-bold"><span>Total</span><span>RM{bill.total_due}</span></div>
                            {bill.total_paid > 0 && (
                              <>
                                <div className="flex justify-between text-green-600"><span>Paid</span><span>-RM{bill.total_paid}</span></div>
                                <div className="flex justify-between font-bold text-red-600"><span>Balance</span><span>RM{bill.total_due - bill.total_paid}</span></div>
                              </>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" icon={Eye} className="flex-1"
                              onClick={() => setViewBill(bill)}>
                              Lihat Bil
                            </Button>
                            {bill.status !== 'paid' && (
                              <Button size="sm" icon={Check} className="flex-1"
                                onClick={() => setPaymentModal({ bill, amount: String(bill.total_due - bill.total_paid), method: 'bank_transfer' })}>
                                Record Payment
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" icon={MessageCircle} className="flex-1 !text-green-600"
                              onClick={() => handleWhatsApp(bill, bill.status === 'paid' ? 'receipt' : bill.status === 'overdue' ? 'reminder' : 'bill')}>
                              {bill.status === 'paid' ? 'Receipt' : bill.status === 'overdue' ? 'Remind' : 'Send Bill'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Floating WhatsApp CTA */}
      {unpaidBills.length > 0 && (
        <button
          onClick={() => unpaidBills.forEach(bill => handleWhatsApp(bill, bill.status === 'overdue' ? 'reminder' : 'bill'))}
          className="fixed bottom-24 right-4 sm:bottom-8 sm:right-8 bg-green-600 text-white px-5 py-3.5 rounded-full shadow-xl hover:bg-green-700 hover:scale-105 active:scale-95 flex items-center gap-2 text-sm font-semibold z-40 animate-in"
          style={{ animationDelay: '300ms' }}
        >
          <MessageCircle size={18} />
          Send All Bills
        </button>
      )}

      {/* Utility Entry Sheet */}
      <UtilityEntrySheet
        open={showUtilitySheet}
        onClose={() => setShowUtilitySheet(false)}
        properties={properties}
        selectedProperty={selectedProperty}
        onPropertyChange={setSelectedProperty}
        month={month}
        onBillsGenerated={handleBillsGenerated}
      />

      {/* Generation Review Sheet */}
      <GenerationReviewSheet
        open={showReviewSheet}
        onClose={() => setShowReviewSheet(false)}
        propertyId={selectedProperty}
        month={month}
        onGenerated={handleBillsGenerated}
      />

      {/* Bill view modal */}
      <BillViewModal bill={viewBill} onClose={() => setViewBill(null)} />

      {/* Payment bottom sheet */}
      <BottomSheet open={!!paymentModal} onClose={() => setPaymentModal(null)} title="Rekod Bayaran">
        {paymentModal && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">{paymentModal.bill.tenant?.name} — RM{paymentModal.bill.total_due}</p>
            <Input label="Jumlah (RM)" type="number" value={paymentModal.amount}
              onChange={(e) => setPaymentModal({ ...paymentModal, amount: e.target.value })} />
            <Select label="Kaedah bayaran" value={paymentModal.method}
              onChange={(e) => setPaymentModal({ ...paymentModal, method: e.target.value as PaymentMethod })}>
              <option value="bank_transfer">Pindahan bank</option>
              <option value="duitnow">DuitNow</option>
              <option value="cash">Tunai</option>
              <option value="other">Lain-lain</option>
            </Select>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => setPaymentModal(null)}>Batal</Button>
              <Button className="flex-1" onClick={handleRecordPayment}>Simpan</Button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}

// === Chart Components ===

function DonutChart({ size, strokeWidth, segments, bgColor = 'rgba(0,0,0,0.06)' }: { size: number; strokeWidth: number; segments: { pct: number; color: string }[]; bgColor?: string }) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const center = size / 2
  let cumulative = 0

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={center} cy={center} r={r} fill="none" strokeWidth={strokeWidth} stroke={bgColor} />
      {segments.map((seg, i) => {
        const dashOffset = circ * cumulative
        cumulative += seg.pct
        return seg.pct > 0 ? (
          <circle key={i} cx={center} cy={center} r={r} fill="none"
            strokeWidth={strokeWidth} stroke={seg.color} strokeLinecap="round"
            strokeDasharray={`${seg.pct * circ} ${circ}`}
            strokeDashoffset={-dashOffset}
            className="transition-all duration-700 ease-out" />
        ) : null
      })}
    </svg>
  )
}

function LegendRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-[12px] text-gray-500 flex-1">{label}</span>
      <span className="text-[13px] font-bold text-gray-800">{value}</span>
    </div>
  )
}

function MonthlyBarChart({ currentMonth, data }: { currentMonth: string; data: { month: string; expected: number; collected: number }[] }) {
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(currentMonth + '-01')
    d.setMonth(d.getMonth() - (5 - i))
    return { key: d.toISOString().slice(0, 7), label: d.toLocaleDateString('en', { month: 'short' }) }
  })

  const bars = months.map(m => {
    const found = data.find(d => d.month === m.key)
    return { ...m, expected: found?.expected || 0, collected: found?.collected || 0 }
  })

  const maxVal = Math.max(...bars.map(d => d.expected), 1)

  return (
    <div className="flex items-end justify-between gap-1" style={{ height: 52 }}>
      {bars.map((bar) => {
        const expH = maxVal > 0 ? (bar.expected / maxVal) * 44 : 0
        const colH = maxVal > 0 ? (bar.collected / maxVal) * 44 : 0
        const isCurrent = bar.key === currentMonth
        const isEmpty = bar.expected === 0 && bar.collected === 0
        return (
          <div key={bar.key} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex gap-0.5 items-end" style={{ height: 44 }}>
              {isEmpty ? (
                <div className="flex-1 rounded-sm bg-gray-100" style={{ height: 4 }} />
              ) : (
                <>
                  <div className="flex-1 rounded-sm bg-gray-200" style={{ height: expH }} />
                  <div className="flex-1 rounded-sm bg-green-500" style={{ height: colH }} />
                </>
              )}
            </div>
            <span className={`text-[8px] ${isCurrent ? 'text-gray-800 font-bold' : 'text-gray-400'}`}>{bar.label}</span>
          </div>
        )
      })}
    </div>
  )
}
