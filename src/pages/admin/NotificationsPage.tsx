import { useEffect, useState } from 'react'
import { getNotifications } from '@/lib/admin-client'
import toast from 'react-hot-toast'

export default function NotificationsPage() {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => { load() }, [status, page])

  async function load() {
    setLoading(true)
    try { const r = await getNotifications({ status, page }); setEntries(r.data); setTotal(r.total) }
    catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  const sent = entries.filter(e => e.status === 'sent').length
  const failed = entries.filter(e => e.status === 'failed').length

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Notification Log</h1>
      <p className="text-sm text-gray-500">Email delivery status. Subscription emails are not logged here yet (Phase 7).</p>

      <div className="flex gap-3 items-center">
        <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All</option><option value="sent">Sent</option><option value="failed">Failed</option>
        </select>
        {entries.length > 0 && (
          <div className="flex gap-2">
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">{sent} sent</span>
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold">{failed} failed</span>
          </div>
        )}
      </div>

      {loading ? <div className="animate-pulse space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-200 rounded-xl" />)}</div> : (
        <div className="space-y-2">
          {entries.map((e: any) => (
            <div key={e.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${e.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{e.status}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{e.type}</span>
                  <span className="text-xs text-gray-500">{e.channel}</span>
                </div>
                <span className="text-xs text-gray-400">{new Date(e.created_at).toLocaleString()}</span>
              </div>
              {e.detail && <pre className="text-xs text-gray-500 mt-2 bg-gray-50 rounded p-2 overflow-x-auto">{typeof e.detail === 'string' ? e.detail : JSON.stringify(e.detail, null, 2)}</pre>}
            </div>
          ))}
          {entries.length === 0 && <p className="text-sm text-gray-500">No notification logs found.</p>}
        </div>
      )}

      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50">Prev</button>
          <span className="px-3 py-1.5 text-sm text-gray-600">Page {page}</span>
          <button disabled={entries.length < 20} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  )
}
