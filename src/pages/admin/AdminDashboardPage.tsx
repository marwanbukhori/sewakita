import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSubscriptionStats, getCronHealth } from '@/lib/admin-client'
import { Users, Building2, CreditCard, TrendingUp, Tag, AlertTriangle, Settings, Clock } from 'lucide-react'

interface Stats {
  active: number
  past_due: number
  expired: number
  cancelled: number
  mrr: number
  totalRevenue: number
  landlordCount: number
  tenantCount: number
  propertyCount: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [cronHealth, setCronHealth] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getSubscriptionStats().then(r => setStats(r.data)),
      getCronHealth().then(r => setCronHealth(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const statCards = [
    { label: 'Landlords', value: stats?.landlordCount ?? 0, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Tenants', value: stats?.tenantCount ?? 0, icon: Users, color: 'text-green-600 bg-green-50' },
    { label: 'Properties', value: stats?.propertyCount ?? 0, icon: Building2, color: 'text-purple-600 bg-purple-50' },
    { label: 'MRR', value: `RM${(stats?.mrr ?? 0).toFixed(0)}`, icon: TrendingUp, color: 'text-amber-600 bg-amber-50' },
  ]

  const subCards = [
    { label: 'Active', value: stats?.active ?? 0, color: 'bg-green-100 text-green-700' },
    { label: 'Past Due', value: stats?.past_due ?? 0, color: 'bg-yellow-100 text-yellow-700' },
    { label: 'Expired', value: stats?.expired ?? 0, color: 'bg-red-100 text-red-700' },
    { label: 'Total Revenue', value: `RM${(stats?.totalRevenue ?? 0).toFixed(0)}`, color: 'bg-blue-100 text-blue-700' },
  ]

  const quickActions = [
    { label: 'Create Promo Code', to: '/admin/promo-codes', icon: Tag },
    { label: 'Pending Claims', to: '/admin/payment-claims?status=pending', icon: AlertTriangle },
    { label: 'Feature Flags', to: '/admin/flags', icon: Settings },
    { label: 'Cron Health', to: '/admin/cron-health', icon: Clock },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>

      {/* Main stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon size={16} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Subscription breakdown */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Subscriptions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {subCards.map((card) => (
            <div key={card.label} className={`rounded-xl px-4 py-3 ${card.color}`}>
              <p className="text-lg font-bold">{card.value}</p>
              <p className="text-xs font-medium opacity-80">{card.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cron health summary */}
      {cronHealth.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Cron Jobs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {cronHealth.map((job: any) => (
              <div key={job.function_name} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${job.status === 'success' ? 'bg-green-500' : job.status === 'failed' ? 'bg-red-500' : 'bg-gray-300'}`} />
                <div>
                  <p className="text-sm font-medium text-gray-900">{job.function_name}</p>
                  <p className="text-xs text-gray-500">
                    {job.completed_at ? new Date(job.completed_at).toLocaleString() : 'Never run'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3"
            >
              <action.icon size={18} className="text-primary-600" />
              <span className="text-sm font-medium text-gray-700">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
