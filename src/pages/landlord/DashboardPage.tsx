import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Building2, Users, AlertTriangle, Plus, FileText, Receipt, TrendingUp, ArrowUpRight, BarChart3, MessageCircle } from 'lucide-react'
import type { Room, MonthlyBill, Profile, Property } from '@/types/database'
import Card from '@/components/ui/Card'
import QuickActions from '@/components/ui/QuickActions'
import EmptyState from '@/components/ui/EmptyState'
import ActivityFeed from '@/components/ui/ActivityFeed'
import { SkeletonDashboard } from '@/components/ui/Skeleton'

interface OverdueBill extends MonthlyBill {
  tenant: Profile
  room: Room & { property: Property }
}

interface DashboardStats {
  totalProperties: number
  totalRooms: number
  occupiedRooms: number
  overdueCount: number
  expectedIncome: number
  collectedIncome: number
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0, totalRooms: 0, occupiedRooms: 0,
    overdueCount: 0, expectedIncome: 0, collectedIncome: 0,
  })
  const [overdueBills, setOverdueBills] = useState<OverdueBill[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    loadDashboard()
  }, [profile])

  async function loadDashboard() {
    const [{ data: properties }, { data: rooms }, { data: bills }] = await Promise.all([
      supabase.from('properties').select('*').eq('landlord_id', profile!.id).eq('is_active', true),
      supabase.from('rooms').select('*, properties!inner(landlord_id)').eq('properties.landlord_id', profile!.id).eq('is_active', true),
      supabase.from('monthly_bills').select('*, rooms!inner(properties!inner(landlord_id))').eq('rooms.properties.landlord_id', profile!.id),
    ])

    const currentMonth = new Date().toISOString().slice(0, 7)
    const currentBills = (bills || []).filter((b: MonthlyBill) => b.month === currentMonth)

    setStats({
      totalProperties: properties?.length || 0,
      totalRooms: rooms?.length || 0,
      occupiedRooms: rooms?.filter((r: Room) => r.status === 'occupied').length || 0,
      overdueCount: currentBills.filter((b: MonthlyBill) => b.status === 'overdue').length,
      expectedIncome: currentBills.reduce((sum: number, b: MonthlyBill) => sum + b.total_due, 0),
      collectedIncome: currentBills.reduce((sum: number, b: MonthlyBill) => sum + b.total_paid, 0),
    })

    // Load overdue bills with tenant details
    const { data: overdueData } = await supabase
      .from('monthly_bills')
      .select('*, tenant:profiles!monthly_bills_tenant_id_fkey(name, phone), room:rooms(label, property:properties(name))')
      .eq('status', 'overdue')
      .eq('month', currentMonth)

    const myOverdue = (overdueData || []).filter((b: OverdueBill) =>
      (b.room?.property as Property & { landlord_id?: string })?.landlord_id === profile!.id
    )
    setOverdueBills(myOverdue)
    setLoading(false)
  }

  if (loading) return <SkeletonDashboard />

  const collectionPercent = stats.expectedIncome > 0 ? Math.round((stats.collectedIncome / stats.expectedIncome) * 100) : 0
  const outstanding = stats.expectedIncome - stats.collectedIncome
  const occupancyPercent = stats.totalRooms > 0 ? Math.round((stats.occupiedRooms / stats.totalRooms) * 100) : 0

  const quickActions = [
    { icon: Building2, label: 'Tambah Hartanah', to: '/properties/new', color: 'bg-primary-50 text-primary-600' },
    { icon: FileText, label: 'Jana Bil', to: '/bil?tab=generate', color: 'bg-amber-50 text-amber-600' },
    { icon: Receipt, label: 'Lihat Bil', to: '/bil', color: 'bg-green-50 text-green-600' },
    { icon: BarChart3, label: 'Laporan', to: '/account/reports/monthly', color: 'bg-purple-50 text-purple-600' },
  ]

  return (
    <div className="space-y-5 animate-in">
      {/* Greeting */}
      <div>
        <p className="text-sm text-gray-500">Selamat kembali,</p>
        <h1 className="text-xl font-bold text-gray-800">{profile?.name}</h1>
      </div>

      {/* Revenue overview */}
      <Card variant="hero" padding="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-white/70 text-sm font-medium">Kutipan Bulan Ini</p>
          <Link to="/payments" className="text-white/60 hover:text-white text-xs flex items-center gap-1">
            Lihat semua <ArrowUpRight size={12} />
          </Link>
        </div>

        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-3xl font-bold tracking-tight">RM{stats.collectedIncome.toLocaleString()}</p>
            <p className="text-white/60 text-sm mt-0.5">daripada RM{stats.expectedIncome.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-white/90">
              <TrendingUp size={14} />
              <span className="text-lg font-bold">{collectionPercent}%</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-white rounded-full transition-all duration-500"
            style={{ width: `${collectionPercent}%` }}
          />
        </div>

        {/* Bottom stats row */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10">
          {outstanding > 0 && (
            <span className="text-xs text-white/70">
              Baki: <strong className="text-white">RM{outstanding.toLocaleString()}</strong>
            </span>
          )}
          {stats.overdueCount > 0 && (
            <span className="bg-red-500/30 text-white text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <AlertTriangle size={10} /> {stats.overdueCount} tertunggak
            </span>
          )}
        </div>
      </Card>

      {/* Quick actions */}
      <QuickActions actions={quickActions} />

      {/* Activity feed */}
      <ActivityFeed />

      {/* Overdue action section */}
      {overdueBills.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-red-500" />
            <h2 className="text-sm font-bold text-gray-800">Perlu Tindakan</h2>
          </div>
          <Card variant="elevated" padding="p-0">
            <div className="divide-y divide-gray-100">
              {overdueBills.slice(0, 5).map((bill) => (
                <div key={bill.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{bill.tenant?.name}</p>
                    <p className="text-xs text-gray-500">{bill.room?.label} — RM{(bill.total_due - bill.total_paid).toLocaleString()}</p>
                  </div>
                  <a
                    href={`https://wa.me/${bill.tenant?.phone?.replace(/[^0-9]/g, '').replace(/^0/, '60')}?text=${encodeURIComponent(`Assalamualaikum ${bill.tenant?.name}, ini peringatan mesra bahawa bayaran sewa RM${bill.total_due - bill.total_paid} untuk bulan ini masih belum diterima. Mohon jelaskan secepat mungkin. Terima kasih.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 active:scale-95"
                  >
                    <MessageCircle size={12} /> Ingatkan
                  </a>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Key metrics — 2x2 grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card variant="default" padding="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
              <Building2 size={16} className="text-primary-600" />
            </div>
            <Link to="/properties" className="text-gray-400 hover:text-primary-500">
              <ArrowUpRight size={14} />
            </Link>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.totalProperties}</p>
          <p className="text-xs text-gray-500 mt-0.5">Hartanah</p>
        </Card>

        <Card variant="default" padding="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users size={16} className="text-blue-600" />
            </div>
            <span className="text-xs text-gray-400">{occupancyPercent}%</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.occupiedRooms}<span className="text-base text-gray-400 font-normal">/{stats.totalRooms}</span></p>
          <p className="text-xs text-gray-500 mt-0.5">Bilik Berisi</p>
        </Card>

        <Card variant="default" padding="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <TrendingUp size={16} className="text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">RM{stats.expectedIncome.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-0.5">Dijangka</p>
        </Card>

        <Card variant="default" padding="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stats.overdueCount > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
              <AlertTriangle size={16} className={stats.overdueCount > 0 ? 'text-red-500' : 'text-gray-400'} />
            </div>
            {stats.overdueCount > 0 && (
              <Link to="/payments" className="text-red-400 hover:text-red-500">
                <ArrowUpRight size={14} />
              </Link>
            )}
          </div>
          <p className={`text-2xl font-bold ${stats.overdueCount > 0 ? 'text-red-600' : 'text-gray-800'}`}>{stats.overdueCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Tertunggak</p>
        </Card>
      </div>

      {/* Empty state */}
      {stats.totalProperties === 0 && (
        <EmptyState
          icon={Building2}
          title="Mula dengan menambah hartanah anda"
          description="Tambah hartanah pertama anda dan mula urus sewa dengan mudah."
          action={{ label: 'Tambah Hartanah', to: '/properties/new' }}
        />
      )}
    </div>
  )
}
