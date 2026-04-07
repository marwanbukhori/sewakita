import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { ArrowLeft, Receipt, CreditCard, UserPlus, UserMinus, AlertTriangle, CheckCircle, Camera } from 'lucide-react'
import type { ActivityLog } from '@/types/database'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { SkeletonList } from '@/components/ui/Skeleton'

const ICONS: Record<string, typeof Receipt> = {
  bill_generated: Receipt,
  payment_received: CreditCard,
  tenant_joined: UserPlus,
  tenant_left: UserMinus,
  overdue: AlertTriangle,
  utility_scanned: Camera,
}

const COLORS: Record<string, string> = {
  bill_generated: 'bg-blue-50 text-blue-600',
  payment_received: 'bg-green-50 text-green-600',
  tenant_joined: 'bg-primary-50 text-primary-600',
  tenant_left: 'bg-gray-100 text-gray-500',
  overdue: 'bg-red-50 text-red-500',
  utility_scanned: 'bg-amber-50 text-amber-600',
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ActivityListPage() {
  const { profile } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    if (!profile) return
    loadActivities()
  }, [profile])

  async function loadActivities(offset = 0) {
    const { data } = await supabase
      .from('activity_log')
      .select('*')
      .eq('landlord_id', profile!.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + 29)

    if (offset === 0) {
      setActivities(data || [])
    } else {
      setActivities(prev => [...prev, ...(data || [])])
    }
    setHasMore((data || []).length === 30)
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

  if (loading) return <SkeletonList count={5} />

  const unreadCount = activities.filter(a => !a.read).length

  // Group by date
  const grouped = activities.reduce<Record<string, ActivityLog[]>>((acc, a) => {
    const date = new Date(a.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })
    if (!acc[date]) acc[date] = []
    acc[date].push(a)
    return acc
  }, {})

  return (
    <div className="space-y-4 animate-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-800">{t('activity.title', 'Activity')}</h1>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
            {t('activity.mark_all_read', 'Mark all read')}
          </button>
        )}
      </div>

      {activities.length === 0 ? (
        <Card variant="elevated" padding="p-6" className="text-center">
          <p className="text-sm text-gray-400">{t('activity.empty', 'No activity yet')}</p>
        </Card>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{date}</p>
              <Card variant="elevated" padding="p-0">
                <div className="divide-y divide-gray-100">
                  {items.map(activity => {
                    const Icon = ICONS[activity.type] || CheckCircle
                    const color = COLORS[activity.type] || 'bg-gray-50 text-gray-500'
                    return (
                      <div key={activity.id} className={`flex items-start gap-3 px-4 py-3 ${!activity.read ? 'bg-primary-50/30' : ''}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                          <Icon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 font-medium">{activity.title}</p>
                          {activity.detail && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{activity.detail}</p>}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[11px] text-gray-400">{timeAgo(activity.created_at)}</span>
                          {!activity.read && <span className="w-2 h-2 rounded-full bg-primary-500" />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>
          ))}

          {hasMore && (
            <Button variant="ghost" fullWidth onClick={() => loadActivities(activities.length)}>
              {t('activity.load_more', 'Load more')}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
