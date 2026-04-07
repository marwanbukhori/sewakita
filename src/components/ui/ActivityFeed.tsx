import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Receipt, CreditCard, UserPlus, UserMinus, AlertTriangle, CheckCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ActivityLog } from '@/types/database'
import Card from './Card'

const ICONS: Record<string, typeof Receipt> = {
  bill_generated: Receipt,
  payment_received: CreditCard,
  tenant_joined: UserPlus,
  tenant_left: UserMinus,
  overdue: AlertTriangle,
}

const COLORS: Record<string, string> = {
  bill_generated: 'bg-blue-50 text-blue-600',
  payment_received: 'bg-green-50 text-green-600',
  tenant_joined: 'bg-primary-50 text-primary-600',
  tenant_left: 'bg-gray-100 text-gray-500',
  overdue: 'bg-red-50 text-red-500',
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })
}

export default function ActivityFeed() {
  const { profile } = useAuth()
  const { t } = useTranslation()
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    loadActivities()
  }, [profile])

  async function loadActivities() {
    const { data } = await supabase
      .from('activity_log')
      .select('*')
      .eq('landlord_id', profile!.id)
      .order('created_at', { ascending: false })
      .limit(10)

    setActivities(data || [])
    setLoading(false)
  }

  async function markAllRead() {
    await supabase
      .from('activity_log')
      .update({ read: true })
      .eq('landlord_id', profile!.id)
      .eq('read', false)

    setActivities(acts => acts.map(a => ({ ...a, read: true })))
  }

  if (loading || activities.length === 0) return null

  const unreadCount = activities.filter(a => !a.read).length

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Activity</h2>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
            Mark all read
          </button>
        )}
      </div>
      <Card variant="elevated" padding="p-0">
        <div className="divide-y divide-gray-100">
          {activities.map((activity) => {
            const Icon = ICONS[activity.type] || CheckCircle
            const color = COLORS[activity.type] || 'bg-gray-50 text-gray-500'
            return (
              <div key={activity.id} className={`flex items-start gap-3 px-4 py-3 ${!activity.read ? 'bg-primary-50/30' : ''}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 font-medium">{activity.title}</p>
                  {activity.detail && <p className="text-xs text-gray-500 mt-0.5">{activity.detail}</p>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs text-gray-400">{timeAgo(activity.created_at)}</span>
                  {!activity.read && <span className="w-2 h-2 rounded-full bg-primary-500" />}
                </div>
              </div>
            )
          })}
        </div>
      </Card>
      <Link to="/activity" className="flex items-center justify-center py-2 text-xs text-primary-600 font-medium hover:text-primary-700">
        {t('activity.see_more', 'See all activity')} →
      </Link>
    </div>
  )
}
