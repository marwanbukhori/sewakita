import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Receipt } from 'lucide-react'
import type { MonthlyBill } from '@/types/database'

export default function TenantBillsPage() {
  const { profile } = useAuth()
  const [bills, setBills] = useState<MonthlyBill[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    loadBills()
  }, [profile])

  async function loadBills() {
    const { data } = await supabase
      .from('monthly_bills')
      .select('*')
      .eq('tenant_id', profile!.id)
      .order('month', { ascending: false })

    setBills(data || [])
    setLoading(false)
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>
  }

  const formatMonth = (m: string) => {
    const [year, month] = m.split('-')
    const months = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis']
    return `${months[parseInt(month) - 1]} ${year}`
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Bil Saya</h1>

      {bills.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Receipt className="mx-auto text-gray-300 mb-3" size={40} />
          <p className="text-gray-500">Tiada sejarah bil.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bills.map((bill) => (
            <div key={bill.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{formatMonth(bill.month)}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  bill.status === 'paid' ? 'bg-success-50 text-green-700' :
                  bill.status === 'overdue' ? 'bg-danger-50 text-red-700' :
                  bill.status === 'partial' ? 'bg-warning-50 text-amber-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {bill.status === 'paid' ? 'Dibayar' :
                   bill.status === 'overdue' ? 'Tertunggak' :
                   bill.status === 'partial' ? 'Separa' : 'Belum bayar'}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Sewa</span><span>RM{bill.rent_amount}</span></div>
                {bill.utility_breakdown?.map((u, i) => (
                  u.amount > 0 && (
                    <div key={i} className="flex justify-between">
                      <span className="text-gray-500">{u.type === 'electric' ? 'Elektrik' : u.type === 'water' ? 'Air' : 'Internet'}</span>
                      <span>RM{u.amount}</span>
                    </div>
                  )
                ))}
                <hr className="border-gray-100" />
                <div className="flex justify-between font-bold"><span>Jumlah</span><span>RM{bill.total_due}</span></div>
                {bill.total_paid > 0 && bill.status !== 'paid' && (
                  <div className="flex justify-between text-danger-500"><span>Baki</span><span>RM{bill.total_due - bill.total_paid}</span></div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
