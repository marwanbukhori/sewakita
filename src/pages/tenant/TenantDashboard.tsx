import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Receipt, CreditCard, Home, Calendar, AlertTriangle, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { MonthlyBill, Tenancy, Room, Property, Payment, RentAgreement } from '@/types/database'
import { format } from 'date-fns'
import Card from '@/components/ui/Card'
import StatusBadge from '@/components/ui/StatusBadge'
import { SkeletonDashboard } from '@/components/ui/Skeleton'

export default function TenantDashboard() {
  const { profile } = useAuth()
  const [tenancy, setTenancy] = useState<(Tenancy & { room: Room & { property: Property } }) | null>(null)
  const [currentBill, setCurrentBill] = useState<MonthlyBill | null>(null)
  const [recentPayments, setRecentPayments] = useState<Payment[]>([])
  const [totalOutstanding, setTotalOutstanding] = useState(0)
  const [overdueMonths, setOverdueMonths] = useState(0)
  const [agreementId, setAgreementId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    loadData()
  }, [profile])

  async function loadData() {
    const { data: tenancyData } = await supabase
      .from('tenancies')
      .select('*, room:rooms(*, property:properties(*))')
      .eq('tenant_id', profile!.id)
      .eq('status', 'active')
      .single()

    setTenancy(tenancyData)

    // Load agreement
    if (tenancyData) {
      const { data: agr } = await supabase
        .from('rent_agreements')
        .select('id')
        .eq('tenant_id', profile!.id)
        .eq('room_id', tenancyData.room_id)
        .eq('status', 'signed')
        .limit(1)
        .single()
      if (agr) setAgreementId(agr.id)
    }

    const currentMonth = new Date().toISOString().slice(0, 7)
    const { data: billData } = await supabase
      .from('monthly_bills')
      .select('*')
      .eq('tenant_id', profile!.id)
      .eq('month', currentMonth)
      .single()

    setCurrentBill(billData)

    // Load all unpaid bills for outstanding balance
    const { data: allBills } = await supabase
      .from('monthly_bills')
      .select('*')
      .eq('tenant_id', profile!.id)
      .neq('status', 'paid')

    const outstanding = (allBills || []).reduce((sum: number, b: MonthlyBill) => sum + (b.total_due - b.total_paid), 0)
    setTotalOutstanding(outstanding)
    setOverdueMonths((allBills || []).filter((b: MonthlyBill) => b.status === 'overdue').length)

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

  if (loading) return <SkeletonDashboard />

  const currentMonthLabel = new Date().toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-4 animate-in">
      <div>
        <p className="text-sm text-gray-500">Selamat datang,</p>
        <h1 className="text-xl font-bold text-gray-800">{profile?.name}</h1>
      </div>

      {/* Outstanding balance warning */}
      {totalOutstanding > 0 && (
        <Card variant="default" padding="p-4" className="border-amber-200 bg-amber-50">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                Baki tertunggak: RM{totalOutstanding.toLocaleString()}
              </p>
              <p className="text-xs text-amber-600">dari {overdueMonths} bulan</p>
            </div>
          </div>
        </Card>
      )}

      {/* Hero bill card */}
      {currentBill ? (
        <Card variant="hero" padding="p-5">
          <p className="text-primary-200 text-sm font-medium mb-1">Bil {currentMonthLabel}</p>
          <p className="text-3xl font-bold mb-4">RM{currentBill.total_due.toLocaleString()}</p>

          {/* Breakdown nested card */}
          <div className="bg-white/15 rounded-xl p-3 space-y-1.5 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-white/80">Sewa bilik</span>
              <span className="font-medium">RM{currentBill.rent_amount}</span>
            </div>
            {currentBill.utility_breakdown?.map((u, i) => (
              u.amount > 0 && (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-white/80">{u.type === 'electric' ? 'Elektrik' : u.type === 'water' ? 'Air' : 'Internet'}</span>
                  <span className="font-medium">RM{u.amount}</span>
                </div>
              )
            ))}
            {currentBill.total_paid > 0 && (
              <>
                <hr className="border-white/20" />
                <div className="flex justify-between text-sm text-green-300">
                  <span>Dibayar</span>
                  <span>-RM{currentBill.total_paid}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span>Baki</span>
                  <span>RM{currentBill.total_due - currentBill.total_paid}</span>
                </div>
              </>
            )}
          </div>

          <StatusBadge
            status={currentBill.status as 'paid' | 'overdue' | 'partial' | 'pending'}
            label={
              currentBill.status === 'paid' ? 'Selesai Dibayar ✓' :
              currentBill.status === 'overdue' ? 'Tertunggak' :
              currentBill.status === 'partial' ? 'Bayaran Separa' : 'Belum Dibayar'
            }
            size="md"
          />
        </Card>
      ) : (
        <Card variant="default" padding="p-6" className="text-center">
          <Receipt className="mx-auto text-gray-300 mb-2" size={32} />
          <p className="text-sm text-gray-500">Tiada bil untuk bulan ini lagi.</p>
        </Card>
      )}

      {/* Tenancy info */}
      {tenancy && (
        <Card variant="elevated" padding="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
              <Home size={18} className="text-primary-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{tenancy.room.property.name}</p>
              <p className="text-xs text-gray-500">{tenancy.room.label} — RM{tenancy.agreed_rent}/bulan</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-gray-100 pt-3">
            <span>Deposit: RM{tenancy.deposit}</span>
            <span className="flex items-center gap-1"><Calendar size={12} /> {format(new Date(tenancy.move_in), 'dd MMM yyyy')}</span>
            {agreementId && (
              <Link to={`/agreements/${agreementId}`} className="flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium">
                <FileText size={12} /> Perjanjian
              </Link>
            )}
          </div>
        </Card>
      )}

      {/* Recent payments */}
      {recentPayments.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Bayaran Terkini</h2>
          <Card variant="elevated" padding="p-0">
            <div className="divide-y divide-gray-100">
              {recentPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm text-gray-900">{format(new Date(p.date), 'dd MMM yyyy')}</p>
                    <p className="text-xs text-gray-400">{p.method === 'bank_transfer' ? 'Pindahan Bank' : p.method === 'duitnow' ? 'DuitNow' : p.method === 'cash' ? 'Tunai' : 'Lain-lain'}</p>
                  </div>
                  <span className="font-semibold text-green-600 text-sm">+RM{p.amount}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
