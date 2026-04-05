import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Building2, Users, AlertTriangle, Plus, FileText, Receipt, TrendingUp, ArrowUpRight, BarChart3, MessageCircle, Clock, Home } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
    { icon: Building2, label: t('quick_actions.add_property'), to: '/properties/new', color: 'bg-primary-50 text-primary-600' },
    { icon: FileText, label: t('quick_actions.generate_bills'), to: '/bil?tab=generate', color: 'bg-amber-50 text-amber-600' },
    { icon: Receipt, label: t('quick_actions.view_bills'), to: '/bil', color: 'bg-green-50 text-green-600' },
    { icon: BarChart3, label: t('quick_actions.reports'), to: '/account/reports/monthly', color: 'bg-purple-50 text-purple-600' },
  ]

  return (
    <div className="space-y-5 animate-in">
      {/* Greeting */}
      <div>
        <p className="text-sm text-gray-500">{t('dashboard.welcome_back')}</p>
        <h1 className="text-xl font-bold text-gray-800">{profile?.name}</h1>
      </div>

      {/* Revenue overview */}
      <Card variant="hero" padding="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-white/70 text-sm font-medium">{t('dashboard.collection_this_month')}</p>
          <Link to="/payments" className="text-white/60 hover:text-white text-xs flex items-center gap-1">
            {t('dashboard.view_all')} <ArrowUpRight size={12} />
          </Link>
        </div>

        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-3xl font-bold tracking-tight">RM{stats.collectedIncome.toLocaleString()}</p>
            <p className="text-white/60 text-sm mt-0.5">{t('dashboard.of')} RM{stats.expectedIncome.toLocaleString()}</p>
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
              {t('dashboard.remaining')}: <strong className="text-white">RM{outstanding.toLocaleString()}</strong>
            </span>
          )}
          {stats.overdueCount > 0 && (
            <span className="bg-red-500/30 text-white text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <AlertTriangle size={10} /> {t('dashboard.overdue_count', { count: stats.overdueCount })}
            </span>
          )}
        </div>
      </Card>

      {/* Quick actions */}
      <QuickActions actions={quickActions} />

      {/* Overdue action section */}
      {overdueBills.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-red-500" />
            <h2 className="text-sm font-bold text-gray-800">{t('dashboard.needs_action')}</h2>
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
                    <MessageCircle size={12} /> {t('dashboard.remind')}
                  </a>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Key metrics — Progress Rings + Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ProgressRingCard
          to="/properties"
          percent={occupancyPercent}
          ringColor="stroke-blue-500"
          ringBg="stroke-blue-100"
          value={`${stats.occupiedRooms} / ${stats.totalRooms}`}
          label={t('dashboard.rooms_filled')}
          subtitle={`${occupancyPercent}% occupancy`}
        />
        <ProgressRingCard
          to="/bil"
          percent={collectionPercent}
          ringColor="stroke-green-500"
          ringBg="stroke-green-100"
          value={`RM${stats.collectedIncome.toLocaleString()}`}
          label={t('dashboard.collection_this_month')}
          subtitle={`of RM${stats.expectedIncome.toLocaleString()}`}
        />
        <Link to="/properties" className="flex flex-col items-center justify-center bg-white rounded-2xl shadow-card p-4 active:scale-[0.97] transition-transform">
          <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center mb-2">
            <Building2 size={18} className="text-primary-600" />
          </div>
          <p className="text-xl font-bold text-gray-800">{stats.totalProperties}</p>
          <p className="text-[11px] text-gray-500 font-medium">{t('dashboard.properties_label')}</p>
        </Link>
        <Link to="/bil" className="flex flex-col items-center justify-center bg-white rounded-2xl shadow-card p-4 active:scale-[0.97] transition-transform">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${stats.overdueCount > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
            <AlertTriangle size={18} className={stats.overdueCount > 0 ? 'text-red-500' : 'text-green-500'} />
          </div>
          <p className={`text-xl font-bold ${stats.overdueCount > 0 ? 'text-red-600' : 'text-gray-800'}`}>{stats.overdueCount}</p>
          <p className="text-[11px] text-gray-500 font-medium">{t('dashboard.overdue')}</p>
        </Link>
      </div>

      {/* Activity feed */}
      <ActivityFeed />

      {/* Empty state */}
      {stats.totalProperties === 0 && (
        <EmptyState
          icon={Building2}
          title={t('dashboard.start_add_property')}
          description={t('dashboard.start_desc')}
          action={{ label: t('dashboard.add_property'), to: '/properties/new' }}
        />
      )}
    </div>
  )
}

function ProgressRingCard({ to, percent, ringColor, ringBg, value, label, subtitle }: {
  to: string
  percent: number
  ringColor: string
  ringBg: string
  value: string
  label: string
  subtitle: string
}) {
  const radius = 28
  const stroke = 5
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference

  return (
    <Link
      to={to}
      className="relative bg-white rounded-2xl shadow-md p-5 flex flex-col items-center gap-3 active:scale-[0.97] transition-transform"
    >
      <div className="relative">
        <svg width="64" height="64" className="-rotate-90">
          <circle cx="32" cy="32" r={radius} fill="none" strokeWidth={stroke} className={ringBg} />
          <circle
            cx="32" cy="32" r={radius} fill="none"
            strokeWidth={stroke} strokeLinecap="round"
            className={`${ringColor} transition-all duration-700 ease-out`}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-700">{percent}%</span>
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-gray-800 leading-tight">{value}</p>
        <p className="text-[11px] text-gray-500 font-medium mt-0.5">{label}</p>
        {subtitle && <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </Link>
  )
}
