import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Building2, Users, AlertTriangle, FileText, Receipt, TrendingUp, ArrowUpRight, BarChart3, MessageCircle, CreditCard, Bell, LinkIcon, FileCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Room, MonthlyBill, Profile, Property } from '@/types/database'
import Card from '@/components/ui/Card'
import QuickActions from '@/components/ui/QuickActions'
import EmptyState from '@/components/ui/EmptyState'
import ActivityFeed from '@/components/ui/ActivityFeed'
import { SkeletonDashboard } from '@/components/ui/Skeleton'
import { BatikBackground, BatikHeroOverlay } from '@/assets/batik/patterns'

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

  return (
    <div className="space-y-5 animate-in">
      {/* Greeting */}
      <div>
        <p className="text-sm text-gray-500">{t('dashboard.welcome_back')}</p>
        <h1 className="text-xl font-bold text-gray-800">{profile?.name}</h1>
      </div>

      {/* Metrics Card — White with geometric batik */}
      <div className="relative bg-white rounded-2xl shadow-md overflow-hidden">
        <BatikBackground className="!opacity-[0.04]" />
        <div className="relative z-10 p-5">
          {/* Rings row */}
          <div className="flex justify-center gap-8 sm:gap-16 mb-4">
            <ProgressRingHero label="Collection" value={`RM${stats.collectedIncome.toLocaleString()}`} sub={`of RM${stats.expectedIncome.toLocaleString()}`} percent={collectionPercent} size={88} />
            <ProgressRingHero label="Occupancy" value={`${stats.occupiedRooms}/${stats.totalRooms}`} sub="rooms filled" percent={occupancyPercent} size={88} />
          </div>
          {/* Stats strip */}
          <div className="flex bg-gray-50 rounded-xl">
            {[
              [String(stats.totalProperties), t('dashboard.properties_label')],
              [`${stats.occupiedRooms}/${stats.totalRooms}`, 'Rooms'],
              [`RM${outstanding.toLocaleString()}`, 'Remaining'],
              [String(stats.overdueCount), t('dashboard.overdue')],
            ].map(([val, label], i, arr) => (
              <div key={label} className={`flex-1 text-center py-2.5 ${i < arr.length - 1 ? 'border-r border-gray-200' : ''}`}>
                <p className="text-sm font-bold text-gray-800">{val}</p>
                <p className="text-[9px] text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions actions={[
        { icon: Building2, label: t('quick_actions.add_property'), to: '/properties/new', color: 'bg-primary-50 text-primary-600' },
        { icon: FileText, label: t('quick_actions.generate_bills'), to: '/bil?tab=generate', color: 'bg-amber-50 text-amber-600' },
        { icon: Receipt, label: t('quick_actions.view_bills'), to: '/bil', color: 'bg-green-50 text-green-600' },
        { icon: BarChart3, label: t('quick_actions.reports'), to: '/account/reports/monthly', color: 'bg-purple-50 text-purple-600' },
      ]} />

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

      {/* Activity feed */}
      <ActivityFeed />

      {/* Highlights */}
      <div>
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">Highlights</h2>
        <div className="space-y-3">
          <HighlightCard
            gradient="from-primary-600 via-primary-700 to-primary-800"
            badge="NEW"
            icon={CreditCard}
            title="FPX Payments Now Live"
            desc="Tenants can pay rent directly via FPX. Instant confirmation & auto-receipts."
            to="/bil"
          />
          <HighlightCard
            gradient="from-emerald-600 via-emerald-700 to-emerald-800"
            badge="TIP"
            icon={MessageCircle}
            title="Send Bills via WhatsApp"
            desc="Tap the green button on any bill to remind tenants instantly. Zero cost."
            to="/bil"
          />
          <HighlightCard
            gradient="from-purple-500 via-purple-700 to-purple-800"
            badge="FEATURE"
            icon={FileCheck}
            title="Auto-generate Rental Agreements"
            desc="Create professional PDF agreements when inviting tenants. One tap."
            to="/tenants/new"
          />
          <HighlightCard
            gradient="from-teal-500 via-teal-700 to-teal-800"
            badge="TIP"
            icon={LinkIcon}
            title="Invite Tenants with a Link"
            desc="Share an invite link via WhatsApp. Tenants sign up and join your property."
            to="/tenants/new"
          />
        </div>
      </div>

      {/* Carousel — commented out for now */}
      {/* <AnnouncementCarousel /> */}

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

function ProgressRingHero({ label, value, sub, percent, size = 68 }: { label: string; value: string; sub?: string; percent: number; size?: number }) {
  const r = (size - 12) / 2, sw = 6
  const circ = 2 * Math.PI * r
  const off = circ - (Math.min(percent, 100) / 100) * circ
  const center = size / 2

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={center} cy={center} r={r} fill="none" strokeWidth={sw} stroke="rgba(0,0,0,0.06)" />
          <circle cx={center} cy={center} r={r} fill="none" strokeWidth={sw} stroke="#22c55e" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={off} className="transition-all duration-700 ease-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${size >= 80 ? 'text-sm' : 'text-xs'} font-bold text-gray-800 leading-none`}>{value}</span>
          <span className="text-[9px] text-gray-400 mt-0.5">{percent}%</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-[11px] font-semibold text-gray-700">{label}</p>
        {sub && <p className="text-[9px] text-gray-400">{sub}</p>}
      </div>
    </div>
  )
}

function HighlightCard({ gradient, badge, icon: Icon, title, desc, to }: {
  gradient: string; badge: string; icon: typeof CreditCard; title: string; desc: string; to: string
}) {
  return (
    <Link to={to} className={`block relative bg-gradient-to-br ${gradient} rounded-2xl p-4 overflow-hidden active:scale-[0.98] transition-transform`}>
      <BatikHeroOverlay />
      <div className="relative z-10 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-[10px] font-semibold px-2.5 py-1 rounded-full mb-2">{badge}</span>
          <p className="text-[15px] font-bold text-white leading-snug">{title}</p>
          <p className="text-xs text-white/70 mt-1 leading-relaxed">{desc}</p>
        </div>
        <div className="shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </Link>
  )
}
