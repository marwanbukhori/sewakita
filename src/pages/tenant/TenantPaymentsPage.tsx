import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { CreditCard, AlertTriangle } from 'lucide-react'
import type { Payment, MonthlyBill } from '@/types/database'
import { format } from 'date-fns'
import Card from '@/components/ui/Card'
import SectionHeader from '@/components/ui/SectionHeader'
import EmptyState from '@/components/ui/EmptyState'

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

  // Group payments by month
  const grouped = payments.reduce<Record<string, PaymentWithBill[]>>((acc, p) => {
    const monthKey = p.date.slice(0, 7)
    if (!acc[monthKey]) acc[monthKey] = []
    acc[monthKey].push(p)
    return acc
  }, {})

  const formatMonthHeader = (m: string) => {
    const [year, month] = m.split('-')
    const months = ['JANUARI', 'FEBRUARI', 'MAC', 'APRIL', 'MEI', 'JUN', 'JULAI', 'OGOS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DISEMBER']
    return `${months[parseInt(month) - 1]} ${year}`
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Bayaran Saya</h1>

      {totalOutstanding > 0 && (
        <Card variant="default" padding="p-4" className="border-amber-200 bg-amber-50">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                Jumlah tertunggak: RM{totalOutstanding.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      )}

      {payments.length === 0 ? (
        <EmptyState icon={CreditCard} title="Tiada rekod bayaran lagi" />
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([month, monthPayments]) => (
            <div key={month}>
              <SectionHeader title={formatMonthHeader(month)} />
              <Card variant="elevated" padding="p-0">
                <div className="divide-y divide-gray-100">
                  {monthPayments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm text-gray-900">{format(new Date(p.date), 'dd MMM yyyy')}</p>
                        <p className="text-xs text-gray-400">{methodLabels[p.method] || p.method}</p>
                      </div>
                      <span className="font-semibold text-green-600 text-sm">+RM{p.amount}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
