import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Receipt, CreditCard, Home, Calendar } from 'lucide-react'
import type { MonthlyBill, Tenancy, Room, Property, Payment } from '@/types/database'
import { format } from 'date-fns'

export default function TenantDashboard() {
  const { profile } = useAuth()
  const [tenancy, setTenancy] = useState<(Tenancy & { room: Room & { property: Property } }) | null>(null)
  const [currentBill, setCurrentBill] = useState<MonthlyBill | null>(null)
  const [recentPayments, setRecentPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    loadData()
  }, [profile])

  async function loadData() {
    // Load active tenancy
    const { data: tenancyData } = await supabase
      .from('tenancies')
      .select('*, room:rooms(*, property:properties(*))')
      .eq('tenant_id', profile!.id)
      .eq('status', 'active')
      .single()

    setTenancy(tenancyData)

    // Load current month's bill
    const currentMonth = new Date().toISOString().slice(0, 7)
    const { data: billData } = await supabase
      .from('monthly_bills')
      .select('*')
      .eq('tenant_id', profile!.id)
      .eq('month', currentMonth)
      .single()

    setCurrentBill(billData)

    // Load recent payments
    if (billData) {
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('bill_id', billData.id)
        .order('date', { ascending: false })

      setRecentPayments(payments || [])
    }

    setLoading(false)
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Selamat datang, {profile?.name}</h1>
        <p className="text-sm text-gray-500">Portal Penyewa</p>
      </div>

      {/* Tenancy info */}
      {tenancy && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Home size={16} /> Maklumat Penyewaan</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Hartanah:</span> <strong>{tenancy.room.property.name}</strong></div>
            <div><span className="text-gray-500">Bilik:</span> <strong>{tenancy.room.label}</strong></div>
            <div><span className="text-gray-500">Sewa:</span> <strong>RM{tenancy.agreed_rent}/bulan</strong></div>
            <div><span className="text-gray-500">Deposit:</span> <strong>RM{tenancy.deposit}</strong></div>
            <div className="flex items-center gap-1"><Calendar size={14} className="text-gray-400" /> <span className="text-gray-500">Masuk:</span> <strong>{format(new Date(tenancy.move_in), 'dd MMM yyyy')}</strong></div>
          </div>
        </div>
      )}

      {/* Current bill */}
      {currentBill ? (
        <div className={`bg-white rounded-xl border p-4 ${currentBill.status === 'overdue' ? 'border-danger-500/30' : 'border-gray-200'}`}>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Receipt size={16} /> Bil Bulan Ini</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Sewa bilik</span>
              <span className="font-medium">RM{currentBill.rent_amount}</span>
            </div>
            {currentBill.utility_breakdown?.map((u, i) => (
              u.amount > 0 && (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-500">{u.type === 'electric' ? 'Elektrik' : u.type === 'water' ? 'Air' : 'Internet'}</span>
                  <span className="font-medium">RM{u.amount}</span>
                </div>
              )
            ))}
            <hr className="border-gray-200" />
            <div className="flex justify-between text-sm font-bold">
              <span>Jumlah</span>
              <span>RM{currentBill.total_due}</span>
            </div>
            {currentBill.total_paid > 0 && (
              <>
                <div className="flex justify-between text-sm text-green-700">
                  <span>Dibayar</span>
                  <span>-RM{currentBill.total_paid}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-danger-500">
                  <span>Baki</span>
                  <span>RM{currentBill.total_due - currentBill.total_paid}</span>
                </div>
              </>
            )}
          </div>
          <div className="mt-3">
            <span className={`text-xs px-3 py-1 rounded-full ${
              currentBill.status === 'paid' ? 'bg-success-50 text-green-700' :
              currentBill.status === 'overdue' ? 'bg-danger-50 text-red-700' :
              currentBill.status === 'partial' ? 'bg-warning-50 text-amber-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {currentBill.status === 'paid' ? 'Selesai Dibayar' :
               currentBill.status === 'overdue' ? 'Tertunggak' :
               currentBill.status === 'partial' ? 'Bayaran Separa' : 'Belum Dibayar'}
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <Receipt className="mx-auto text-gray-300 mb-2" size={32} />
          <p className="text-sm text-gray-500">Tiada bil untuk bulan ini lagi.</p>
        </div>
      )}

      {/* Recent payments */}
      {recentPayments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><CreditCard size={16} /> Bayaran Terkini</h2>
          <div className="space-y-2">
            {recentPayments.map((p) => (
              <div key={p.id} className="flex justify-between text-sm bg-gray-50 rounded-lg p-3">
                <div>
                  <span className="text-gray-500">{format(new Date(p.date), 'dd MMM yyyy')}</span>
                  <span className="ml-2 text-xs text-gray-400">{p.method}</span>
                </div>
                <span className="font-medium text-green-700">RM{p.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
