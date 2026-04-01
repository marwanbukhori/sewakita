import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Building2, Users, Receipt, AlertTriangle, Plus } from 'lucide-react'
import type { Property, Room, MonthlyBill } from '@/types/database'

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

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Selamat kembali, {profile?.name}</p>
        </div>
        <Link
          to="/properties/new"
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <Plus size={16} />
          Tambah Hartanah
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Building2} label="Hartanah" value={stats.totalProperties} />
        <StatCard icon={Users} label="Bilik Berisi" value={`${stats.occupiedRooms}/${stats.totalRooms}`} />
        <StatCard icon={Receipt} label="Dijangka" value={`RM${stats.expectedIncome.toLocaleString()}`} />
        <StatCard
          icon={AlertTriangle}
          label="Tertunggak"
          value={stats.overdueCount}
          variant={stats.overdueCount > 0 ? 'danger' : 'default'}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Kutipan Bulan Ini</h2>
        <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-primary-500 rounded-full transition-all"
            style={{ width: stats.expectedIncome > 0 ? `${(stats.collectedIncome / stats.expectedIncome) * 100}%` : '0%' }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span className="text-gray-500">
            Dikutip: <strong className="text-gray-900">RM{stats.collectedIncome.toLocaleString()}</strong>
          </span>
          <span className="text-gray-500">
            Sasaran: <strong className="text-gray-900">RM{stats.expectedIncome.toLocaleString()}</strong>
          </span>
        </div>
      </div>

      {stats.totalProperties === 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-6 text-center">
          <Building2 className="mx-auto text-primary-600 mb-3" size={32} />
          <h3 className="font-semibold text-gray-900">Mula dengan menambah hartanah anda</h3>
          <p className="text-sm text-gray-500 mt-1">Tambah hartanah pertama anda dan mula urus sewa dengan mudah.</p>
          <Link
            to="/properties/new"
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium mt-4 hover:bg-primary-700 transition-colors"
          >
            <Plus size={16} />
            Tambah Hartanah
          </Link>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, variant = 'default' }: {
  icon: typeof Building2
  label: string
  value: string | number
  variant?: 'default' | 'danger'
}) {
  return (
    <div className={`bg-white rounded-xl border p-4 ${variant === 'danger' ? 'border-danger-500/30' : 'border-gray-200'}`}>
      <Icon size={18} className={variant === 'danger' ? 'text-danger-500' : 'text-primary-600'} />
      <div className="mt-2 text-xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
}
