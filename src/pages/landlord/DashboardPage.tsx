import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Building2, Users, Receipt, AlertTriangle, Plus, UserPlus, FileText, CreditCard } from 'lucide-react'
import type { Room, MonthlyBill } from '@/types/database'
import Card from '@/components/ui/Card'
import QuickActions from '@/components/ui/QuickActions'
import EmptyState from '@/components/ui/EmptyState'
import { SkeletonDashboard } from '@/components/ui/Skeleton'

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
    totalProperties: 0,
    totalRooms: 0,
    occupiedRooms: 0,
    overdueCount: 0,
    expectedIncome: 0,
    collectedIncome: 0,
  })
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
    setLoading(false)
  }

  if (loading) return <SkeletonDashboard />

  const collectionPercent = stats.expectedIncome > 0 ? Math.round((stats.collectedIncome / stats.expectedIncome) * 100) : 0

  const quickActions = [
    { icon: Building2, label: 'Tambah Hartanah', to: '/properties/new', color: 'bg-primary-50 text-primary-600' },
    { icon: UserPlus, label: 'Tambah Penyewa', to: '/tenants/new', color: 'bg-blue-50 text-blue-600' },
    { icon: FileText, label: 'Jana Bil', to: '/billing', color: 'bg-amber-50 text-amber-600' },
    { icon: CreditCard, label: 'Rekod Bayaran', to: '/payments', color: 'bg-green-50 text-green-600' },
  ]

  return (
    <div className="space-y-5 animate-in">
      {/* Greeting */}
      <div>
        <p className="text-sm text-gray-500">Selamat kembali,</p>
        <h1 className="text-xl font-bold text-gray-800">{profile?.name}</h1>
      </div>

      {/* Hero collection card */}
      <Card variant="hero" padding="p-5">
        <p className="text-primary-200 text-sm font-medium mb-1">Kutipan Bulan Ini</p>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold">RM{stats.collectedIncome.toLocaleString()}</span>
          <span className="text-primary-200 text-sm">/ RM{stats.expectedIncome.toLocaleString()}</span>
        </div>
        <div className="relative h-2.5 bg-white/20 rounded-full overflow-hidden mb-3">
          <div
            className="absolute inset-y-0 left-0 bg-white rounded-full transition-all"
            style={{ width: `${collectionPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/80">{collectionPercent}% dikutip</span>
            {stats.overdueCount > 0 && (
              <span className="bg-red-500/80 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                {stats.overdueCount} Tertunggak
              </span>
            )}
          </div>
          <Link to="/payments" className="text-sm text-white/80 hover:text-white transition-colors">
            Lihat Semua →
          </Link>
        </div>
      </Card>

      {/* Quick actions */}
      <QuickActions actions={quickActions} />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card variant="elevated" className="relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary-500 rounded-l-xl" />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
              <Building2 size={18} className="text-primary-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{stats.totalProperties}</div>
              <div className="text-xs text-gray-500">Hartanah</div>
            </div>
          </div>
        </Card>

        <Card variant="elevated" className="relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-xl" />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <Users size={18} className="text-blue-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{stats.occupiedRooms}/{stats.totalRooms}</div>
              <div className="text-xs text-gray-500">Bilik Berisi</div>
            </div>
          </div>
        </Card>

        <Card variant="elevated" className="relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-green-500 rounded-l-xl" />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center shrink-0">
              <Receipt size={18} className="text-green-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">RM{stats.expectedIncome.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Dijangka</div>
            </div>
          </div>
        </Card>

        <Card variant="elevated" className={`relative overflow-hidden ${stats.overdueCount > 0 ? 'ring-1 ring-danger-500/20' : ''}`}>
          <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${stats.overdueCount > 0 ? 'bg-danger-500' : 'bg-gray-300'}`} />
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${stats.overdueCount > 0 ? 'bg-danger-50' : 'bg-gray-50'}`}>
              <AlertTriangle size={18} className={stats.overdueCount > 0 ? 'text-danger-500' : 'text-gray-400'} />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{stats.overdueCount}</div>
              <div className="text-xs text-gray-500">Tertunggak</div>
            </div>
          </div>
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
