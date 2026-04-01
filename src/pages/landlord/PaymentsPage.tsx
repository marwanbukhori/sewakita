import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { CreditCard, Check, MessageCircle } from 'lucide-react'
import type { MonthlyBill, Property, Room, Tenancy, Profile, PaymentMethod } from '@/types/database'
import toast from 'react-hot-toast'
import { generateBillMessage, generateReminderMessage, generateReceiptMessage } from '@/lib/whatsapp'

interface BillWithDetails extends MonthlyBill {
  room: Room & { property: Property }
  tenant: Profile
}

export default function PaymentsPage() {
  const { profile } = useAuth()
  const [bills, setBills] = useState<BillWithDetails[]>([])
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [loading, setLoading] = useState(true)
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

    // Filter by landlord
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

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>
  }

  const totalExpected = bills.reduce((s, b) => s + b.total_due, 0)
  const totalCollected = bills.reduce((s, b) => s + b.total_paid, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Bayaran</h1>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Dijangka: <strong className="text-gray-900">RM{totalExpected.toLocaleString()}</strong></span>
          <span className="text-gray-500">Dikutip: <strong className="text-primary-700">RM{totalCollected.toLocaleString()}</strong></span>
          <span className="text-gray-500">Baki: <strong className="text-danger-500">RM{(totalExpected - totalCollected).toLocaleString()}</strong></span>
        </div>
      </div>

      {/* Bills list */}
      {bills.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <CreditCard className="mx-auto text-gray-300 mb-3" size={40} />
          <p className="text-gray-500 text-sm">Tiada bil untuk bulan ini.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bills.map((bill) => (
            <div key={bill.id} className={`bg-white rounded-xl border p-4 ${
              bill.status === 'overdue' ? 'border-danger-500/30' : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-medium text-gray-900">{bill.tenant?.name}</h3>
                  <p className="text-xs text-gray-500">{bill.room?.property?.name} — {bill.room?.label}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">RM{bill.total_due}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    bill.status === 'paid' ? 'bg-success-50 text-green-700' :
                    bill.status === 'overdue' ? 'bg-danger-50 text-red-700' :
                    bill.status === 'partial' ? 'bg-warning-50 text-amber-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {bill.status === 'paid' ? 'Dibayar' :
                     bill.status === 'overdue' ? 'Tertunggak' :
                     bill.status === 'partial' ? `Separa (RM${bill.total_paid})` : 'Belum bayar'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                {bill.status !== 'paid' && (
                  <button
                    onClick={() => setPaymentModal({ bill, amount: String(bill.total_due - bill.total_paid), method: 'bank_transfer' })}
                    className="flex items-center gap-1 px-3 py-1.5 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700"
                  >
                    <Check size={12} /> Rekod Bayaran
                  </button>
                )}
                <button
                  onClick={() => handleWhatsApp(bill, bill.status === 'paid' ? 'receipt' : bill.status === 'overdue' ? 'reminder' : 'bill')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700"
                >
                  <MessageCircle size={12} />
                  {bill.status === 'paid' ? 'Resit' : bill.status === 'overdue' ? 'Peringatan' : 'Hantar Bil'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-5 w-full max-w-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Rekod Bayaran</h2>
            <p className="text-sm text-gray-500">{paymentModal.bill.tenant?.name} — RM{paymentModal.bill.total_due}</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (RM)</label>
              <input type="number" value={paymentModal.amount}
                onChange={(e) => setPaymentModal({ ...paymentModal, amount: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kaedah bayaran</label>
              <select value={paymentModal.method}
                onChange={(e) => setPaymentModal({ ...paymentModal, method: e.target.value as PaymentMethod })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
                <option value="bank_transfer">Pindahan bank</option>
                <option value="duitnow">DuitNow</option>
                <option value="cash">Tunai</option>
                <option value="other">Lain-lain</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setPaymentModal(null)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                Batal
              </button>
              <button onClick={handleRecordPayment}
                className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
