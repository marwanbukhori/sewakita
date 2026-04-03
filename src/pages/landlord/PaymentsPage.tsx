import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { CreditCard, Check, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react'
import type { MonthlyBill, Property, Room, Profile, PaymentMethod } from '@/types/database'
import toast from 'react-hot-toast'
import { generateBillMessage, generateReminderMessage, generateReceiptMessage } from '@/lib/whatsapp'
import Card from '@/components/ui/Card'
import StatusBadge from '@/components/ui/StatusBadge'
import SectionHeader from '@/components/ui/SectionHeader'
import EmptyState from '@/components/ui/EmptyState'
import BottomSheet from '@/components/ui/BottomSheet'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { SkeletonList } from '@/components/ui/Skeleton'

interface BillWithDetails extends MonthlyBill {
  room: Room & { property: Property }
  tenant: Profile
}

type StatusFilter = 'all' | 'overdue' | 'pending' | 'paid'

export default function PaymentsPage() {
  const { profile } = useAuth()
  const [bills, setBills] = useState<BillWithDetails[]>([])
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [loading, setLoading] = useState(true)
  const [expandedBill, setExpandedBill] = useState<string | null>(null)
  const [paymentModal, setPaymentModal] = useState<{ bill: BillWithDetails; amount: string; method: PaymentMethod } | null>(null)

  useEffect(() => {
    if (!profile) return
    loadBills()
  }, [profile, month])

  async function loadBills() {
    setLoading(true)
    const { data } = await supabase
      .from('monthly_bills')
      .select(`
        *,
        room:rooms(*, property:properties(*)),
        tenant:profiles!monthly_bills_tenant_id_fkey(*)
      `)
      .eq('month', month)
      .order('status')

    const myBills = (data || []).filter((b: BillWithDetails) => b.room?.property?.landlord_id === profile!.id)
    setBills(myBills)
    setLoading(false)
  }

  async function handleRecordPayment() {
    if (!paymentModal) return
    const { bill, amount, method } = paymentModal
    const payAmount = Number(amount)

    if (payAmount <= 0) { toast.error('Sila masukkan jumlah yang sah.'); return }

    const { error } = await supabase.from('payments').insert({
      bill_id: bill.id,
      amount: payAmount,
      date: new Date().toISOString().split('T')[0],
      method,
      receipt_sent: false,
    })

    if (error) { toast.error('Gagal merekod bayaran.'); return }

    const newTotalPaid = bill.total_paid + payAmount
    const newStatus = newTotalPaid >= bill.total_due ? 'paid' : 'partial'

    await supabase.from('monthly_bills').update({
      total_paid: newTotalPaid,
      status: newStatus,
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

  if (loading) return <SkeletonList count={3} />

  const totalExpected = bills.reduce((s, b) => s + b.total_due, 0)
  const totalCollected = bills.reduce((s, b) => s + b.total_paid, 0)
  const collectionPercent = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0

  const filteredBills = statusFilter === 'all' ? bills : bills.filter(b => {
    if (statusFilter === 'overdue') return b.status === 'overdue'
    if (statusFilter === 'pending') return b.status === 'pending' || b.status === 'partial'
    return b.status === 'paid'
  })

  // Group by property
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

  return (
    <div className="space-y-4 animate-in">
      <h1 className="text-xl font-bold text-gray-800">Bayaran</h1>

      {/* Summary strip */}
      <Card variant="elevated" padding="p-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-gray-500">Dijangka</p>
            <p className="text-sm font-bold text-gray-900">RM{totalExpected.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Dikutip</p>
            <p className="text-sm font-bold text-primary-700">RM{totalCollected.toLocaleString()}</p>
            <p className="text-[10px] text-primary-500">({collectionPercent}%)</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Baki</p>
            <p className="text-sm font-bold text-danger-500">RM{(totalExpected - totalCollected).toLocaleString()}</p>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
          className="h-10 px-3 border border-gray-200 rounded-lg text-base bg-white" />
        <div className="flex gap-1.5 flex-1 overflow-x-auto scrollbar-none">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3.5 h-10 rounded-full text-xs font-semibold whitespace-nowrap active:scale-95 ${
                statusFilter === opt.value
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 shadow-card hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bills grouped by property */}
      {filteredBills.length === 0 ? (
        <EmptyState icon={CreditCard} title="Tiada bil untuk bulan ini" />
      ) : (
        <div className="space-y-5">
          {Object.values(grouped).map(({ property, bills: propBills }) => (
            <div key={property.id}>
              <SectionHeader title={property.name} action={{ label: `${propBills.length} bil`, to: `/properties/${property.id}` }} />
              <Card variant="elevated" padding="p-0">
                <div className="divide-y divide-gray-100">
                  {propBills.map((bill) => {
                    const isExpanded = expandedBill === bill.id
                    return (
                      <div key={bill.id}>
                        <button
                          onClick={() => setExpandedBill(isExpanded ? null : bill.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">{bill.tenant?.name}</p>
                            <p className="text-xs text-gray-500">{bill.room?.label}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-gray-900 text-sm">RM{bill.total_due}</p>
                          </div>
                          <StatusBadge status={bill.status as 'paid' | 'overdue' | 'partial' | 'pending'} />
                          {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-3 flex gap-2">
                            {bill.status !== 'paid' && (
                              <button
                                onClick={() => setPaymentModal({ bill, amount: String(bill.total_due - bill.total_paid), method: 'bank_transfer' })}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700 transition-colors"
                              >
                                <Check size={12} /> Rekod Bayaran
                              </button>
                            )}
                            <button
                              onClick={() => handleWhatsApp(bill, bill.status === 'paid' ? 'receipt' : bill.status === 'overdue' ? 'reminder' : 'bill')}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <MessageCircle size={12} />
                              {bill.status === 'paid' ? 'Resit' : bill.status === 'overdue' ? 'Peringatan' : 'Hantar Bil'}
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Floating WhatsApp CTA */}
      {unpaidBills.length > 0 && (
        <button
          onClick={() => {
            unpaidBills.forEach(bill => handleWhatsApp(bill, bill.status === 'overdue' ? 'reminder' : 'bill'))
          }}
          className="fixed bottom-24 right-4 sm:bottom-8 sm:right-8 bg-green-600 text-white px-5 py-3.5 rounded-full shadow-xl hover:bg-green-700 hover:scale-105 active:scale-95 flex items-center gap-2 text-sm font-semibold z-40 animate-in"
          style={{ animationDelay: '300ms' }}
        >
          <MessageCircle size={18} />
          Hantar Semua Bil
        </button>
      )}

      {/* Payment bottom sheet */}
      <BottomSheet
        open={!!paymentModal}
        onClose={() => setPaymentModal(null)}
        title="Rekod Bayaran"
      >
        {paymentModal && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">{paymentModal.bill.tenant?.name} — RM{paymentModal.bill.total_due}</p>
            <Input
              label="Jumlah (RM)"
              type="number"
              value={paymentModal.amount}
              onChange={(e) => setPaymentModal({ ...paymentModal, amount: e.target.value })}
            />
            <Select
              label="Kaedah bayaran"
              value={paymentModal.method}
              onChange={(e) => setPaymentModal({ ...paymentModal, method: e.target.value as PaymentMethod })}
            >
              <option value="bank_transfer">Pindahan bank</option>
              <option value="duitnow">DuitNow</option>
              <option value="cash">Tunai</option>
              <option value="other">Lain-lain</option>
            </Select>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => setPaymentModal(null)}>
                Batal
              </Button>
              <Button className="flex-1" onClick={handleRecordPayment}>
                Simpan
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
