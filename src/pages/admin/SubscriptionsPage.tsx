import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSubscriptions, getSubscriptionStats } from '@/lib/admin-client'
import toast from 'react-hot-toast'

const statusColors: Record<string, string> = { active: 'bg-green-100 text-green-700', past_due: 'bg-yellow-100 text-yellow-700', expired: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-700' }

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => { load() }, [status, page])
  useEffect(() => { getSubscriptionStats().then(r => setStats(r.data)).catch(() => {}) }, [])

  async function load() {
    setLoading(true)
    try { const r = await getSubscriptions({ status, page }); setSubs(r.data); setTotal(r.total) }
    catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Subscriptions</h1>
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[{ l: 'Active', v: stats.active, c: 'bg-green-100 text-green-700' }, { l: 'Past Due', v: stats.past_due, c: 'bg-yellow-100 text-yellow-700' }, { l: 'Expired', v: stats.expired, c: 'bg-red-100 text-red-700' }, { l: 'MRR', v: `RM${stats.mrr?.toFixed(0) || 0}`, c: 'bg-blue-100 text-blue-700' }, { l: 'Revenue', v: `RM${stats.totalRevenue?.toFixed(0) || 0}`, c: 'bg-purple-100 text-purple-700' }].map(s => (
            <div key={s.l} className={`rounded-xl px-4 py-3 ${s.c}`}><p className="text-lg font-bold">{s.v}</p><p className="text-xs font-medium opacity-80">{s.l}</p></div>
          ))}
        </div>
      )}
      <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
        <option value="">All</option><option value="active">Active</option><option value="past_due">Past Due</option><option value="expired">Expired</option><option value="cancelled">Cancelled</option>
      </select>
      {loading ? <div className="animate-pulse space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-200 rounded-xl" />)}</div> : (
        <div className="space-y-2">
          {subs.map((s: any) => (
            <Link key={s.id} to={`/admin/users/${s.landlord?.id || s.landlord_id}`} className="block bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{s.landlord?.name || '—'}</p>
                  <p className="text-xs text-gray-500">{s.landlord?.email} | {s.plan?.display_name || s.plan_code}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColors[s.status] || 'bg-gray-100'}`}>{s.status}</span>
                  <p className="text-xs text-gray-400 mt-1">ends {new Date(s.period_end).toLocaleDateString()}</p>
                </div>
              </div>
            </Link>
          ))}
          {subs.length === 0 && <p className="text-sm text-gray-500">No subscriptions found.</p>}
        </div>
      )}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50">Prev</button>
          <span className="px-3 py-1.5 text-sm text-gray-600">Page {page}</span>
          <button disabled={subs.length < 20} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  )
}
