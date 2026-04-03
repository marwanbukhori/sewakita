import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Receipt, ChevronDown, ChevronUp } from 'lucide-react'
import type { MonthlyBill } from '@/types/database'
import Card from '@/components/ui/Card'
import StatusBadge from '@/components/ui/StatusBadge'
import SectionHeader from '@/components/ui/SectionHeader'
import EmptyState from '@/components/ui/EmptyState'

export default function TenantBillsPage() {
  const { profile } = useAuth()
  const [bills, setBills] = useState<MonthlyBill[]>([])
  const [expandedBill, setExpandedBill] = useState<string | null>(null)
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
    const months = ['JANUARI', 'FEBRUARI', 'MAC', 'APRIL', 'MEI', 'JUN', 'JULAI', 'OGOS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DISEMBER']
    return `${months[parseInt(month) - 1]} ${year}`
  }

  // Group by month
  const grouped = bills.reduce<Record<string, MonthlyBill[]>>((acc, bill) => {
    if (!acc[bill.month]) acc[bill.month] = []
    acc[bill.month].push(bill)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Bil Saya</h1>

      {bills.length === 0 ? (
        <EmptyState icon={Receipt} title="Tiada sejarah bil" />
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([month, monthBills]) => (
            <div key={month}>
              <SectionHeader title={formatMonth(month)} />
              <Card variant="elevated" padding="p-0">
                <div className="divide-y divide-gray-100">
                  {monthBills.map((bill) => {
                    const isExpanded = expandedBill === bill.id
                    const hasBalance = bill.total_paid > 0 && bill.status !== 'paid'
                    return (
                      <div key={bill.id}>
                        <button
                          onClick={() => setExpandedBill(isExpanded ? null : bill.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm">Sewa + Utiliti</p>
                            {hasBalance && (
                              <p className="text-xs text-danger-500">Baki: RM{bill.total_due - bill.total_paid}</p>
                            )}
                          </div>
                          <span className="font-bold text-gray-900 text-sm shrink-0">RM{bill.total_due}</span>
                          <StatusBadge status={bill.status as 'paid' | 'overdue' | 'partial' | 'pending'} />
                          {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-3 space-y-1.5">
                            <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Sewa</span>
                                <span>RM{bill.rent_amount}</span>
                              </div>
                              {bill.utility_breakdown?.map((u, i) => (
                                u.amount > 0 && (
                                  <div key={i} className="flex justify-between">
                                    <span className="text-gray-500">
                                      {u.type === 'electric' ? 'Elektrik' : u.type === 'water' ? 'Air' : 'Internet'}
                                    </span>
                                    <span>RM{u.amount}</span>
                                  </div>
                                )
                              ))}
                              <hr className="border-gray-200" />
                              <div className="flex justify-between font-bold">
                                <span>Jumlah</span>
                                <span>RM{bill.total_due}</span>
                              </div>
                            </div>
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
    </div>
  )
}
