import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { CreditCard } from 'lucide-react'
import type { Payment, MonthlyBill } from '@/types/database'
import { format } from 'date-fns'

interface PaymentWithBill extends Payment {
  bill: MonthlyBill
}

export default function TenantPaymentsPage() {
  const { profile } = useAuth()
  const [payments, setPayments] = useState<PaymentWithBill[]>([])
  const [totalOutstanding, setTotalOutstanding] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    loadPayments()
  }, [profile])

  async function loadPayments() {
    // Get all bills for this tenant
    const { data: bills } = await supabase
      .from('monthly_bills')
      .select('*, payments(*)')
      .eq('tenant_id', profile!.id)
      .order('month', { ascending: false })

    const allPayments: PaymentWithBill[] = []
    let outstanding = 0

    for (const bill of (bills || [])) {
      if (bill.status !== 'paid') {
        outstanding += bill.total_due - bill.total_paid
      }
      for (const payment of (bill.payments || [])) {
        allPayments.push({ ...payment, bill })
      }
    }

    allPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    setPayments(allPayments)
    setTotalOutstanding(outstanding)
    setLoading(false)
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>
  }

  const methodLabels: Record<string, string> = {
    bank_transfer: 'Pindahan Bank',
    duitnow: 'DuitNow',
    cash: 'Tunai',
    other: 'Lain-lain',
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Bayaran Saya</h1>

      {totalOutstanding > 0 && (
        <div className="bg-danger-50 rounded-xl border border-red-200 p-4">
          <p className="text-sm text-red-700">Jumlah tertunggak: <strong className="text-lg">RM{totalOutstanding.toLocaleString()}</strong></p>
        </div>
      )}

      {payments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <CreditCard className="mx-auto text-gray-300 mb-3" size={40} />
          <p className="text-gray-500">Tiada rekod bayaran lagi.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">RM{p.amount}</div>
                <div className="text-xs text-gray-500">
                  {format(new Date(p.date), 'dd MMM yyyy')} • {methodLabels[p.method] || p.method}
                </div>
                <div className="text-xs text-gray-400">Bil: {p.bill.month}</div>
              </div>
              <span className="text-xs bg-success-50 text-green-700 px-2 py-1 rounded-full">Dibayar</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
